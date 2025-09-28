"use client";

import { useState, useCallback } from "react";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { ZKLOGIN_CONFIG, ZkLoginProvider } from "./config";

interface ZkLoginState {
  isLoading: boolean;
  user: any | null;
  ephemeralKeyPair: Ed25519Keypair | null;
  userSalt: string | null;
  jwt: string | null;
}

// Simple JWT decode function
function parseJwt(token: string) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error parsing JWT:', error);
    return null;
  }
}

export function useZkLogin() {
  const [state, setState] = useState<ZkLoginState>({
    isLoading: false,
    user: null,
    ephemeralKeyPair: null,
    userSalt: null,
    jwt: null,
  });

  // Generate ephemeral key pair
  const generateEphemeralKeyPair = useCallback(() => {
    const ephemeralKeyPair = new Ed25519Keypair();
    setState(prev => ({ ...prev, ephemeralKeyPair }));
    return ephemeralKeyPair;
  }, []);

  // Start OAuth login flow
  const loginWithProvider = useCallback(async (provider: ZkLoginProvider) => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      // Validate configuration
      const providerConfig = ZKLOGIN_CONFIG.providers[provider];
      if (!providerConfig.clientId) {
        throw new Error(`${provider} client ID is not configured. Please set NEXT_PUBLIC_GOOGLE_CLIENT_ID in your .env.local file.`);
      }
      
      // Generate ephemeral key pair
      const ephemeralKeyPair = generateEphemeralKeyPair();
      
      // Store the keypair and metadata in session storage
      const privateKey = ephemeralKeyPair.getSecretKey();
      const privateKeyHex = Buffer.from(privateKey).toString('hex');
      
      sessionStorage.setItem("zklogin_ephemeral_keypair", privateKeyHex);
      sessionStorage.setItem("zklogin_timestamp", Date.now().toString());
      sessionStorage.setItem("zklogin_provider", provider);
      
      console.log("Stored ephemeral key pair:", {
        keyLength: privateKeyHex.length,
        timestamp: Date.now(),
        provider
      });
      
      // For now, create a simple nonce (in production, use proper zkLogin nonce generation)
      const nonce = Math.random().toString(36).substring(2, 15);
      
      // Build OAuth URL
      let authUrl = "";
      
      if (provider === "google") {
        authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
          `client_id=${providerConfig.clientId}&` +
          `response_type=id_token&` +
          `redirect_uri=${encodeURIComponent(providerConfig.redirectUrl)}&` +
          `scope=openid email profile&` +
          `nonce=${nonce}`;
      }
      
      // Redirect to OAuth provider
      if (authUrl) {
        console.log("Redirecting to OAuth URL:", authUrl);
        window.location.href = authUrl;
      } else {
        throw new Error(`Provider ${provider} not supported yet`);
      }
    } catch (error) {
      console.error("Login error:", error);
      alert(`Login failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [generateEphemeralKeyPair]);

  // Handle OAuth callback
  const handleAuthCallback = useCallback(async (jwt: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      // Parse JWT to get user info
      const decodedJWT = parseJwt(jwt);
      if (!decodedJWT) {
        throw new Error("Invalid JWT token");
      }
      
      // Try to restore ephemeral key pair from storage
      let ephemeralKeyPair: Ed25519Keypair;
      const ephemeralPrivateKeyHex = sessionStorage.getItem("zklogin_ephemeral_keypair");
      const storedTimestamp = sessionStorage.getItem("zklogin_timestamp");
      const storedProvider = sessionStorage.getItem("zklogin_provider");
      
      console.log("Callback debug info:", {
        hasKey: !!ephemeralPrivateKeyHex,
        keyLength: ephemeralPrivateKeyHex?.length,
        timestamp: storedTimestamp,
        provider: storedProvider,
        timeDiff: storedTimestamp ? Date.now() - parseInt(storedTimestamp) : 'N/A'
      });
      
      if (!ephemeralPrivateKeyHex) {
        // Fallback: generate a new ephemeral key pair if none exists
        console.warn("No stored ephemeral key pair found, generating new one");
        ephemeralKeyPair = new Ed25519Keypair();
      } else {
        try {
          ephemeralKeyPair = Ed25519Keypair.fromSecretKey(Buffer.from(ephemeralPrivateKeyHex, 'hex'));
          console.log("Successfully restored ephemeral key pair");
        } catch (keyError) {
          console.warn("Failed to restore ephemeral key pair, generating new one:", keyError);
          ephemeralKeyPair = new Ed25519Keypair();
        }
      }
      
      // Generate user salt (simplified)
      const userSalt = ZKLOGIN_CONFIG.salt;
      
      setState(prev => ({
        ...prev,
        user: decodedJWT,
        ephemeralKeyPair,
        userSalt,
        jwt,
        isLoading: false,
      }));
      
      // Clean up session storage
      sessionStorage.removeItem("zklogin_ephemeral_keypair");
      sessionStorage.removeItem("zklogin_timestamp");
      sessionStorage.removeItem("zklogin_provider");
    } catch (error) {
      console.error("Auth callback error:", error);
      setState(prev => ({ ...prev, isLoading: false }));
      throw error; // Re-throw to let the callback component handle it
    }
  }, []);

  // Logout
  const logout = useCallback(() => {
    setState({
      isLoading: false,
      user: null,
      ephemeralKeyPair: null,
      userSalt: null,
      jwt: null,
    });
    
    // Clear session storage
    sessionStorage.removeItem("zklogin_ephemeral_keypair");
    sessionStorage.removeItem("zklogin_timestamp");
    sessionStorage.removeItem("zklogin_provider");
  }, []);

  // Check if user is authenticated
  const isAuthenticated = state.user !== null && state.ephemeralKeyPair !== null;

  return {
    ...state,
    isAuthenticated,
    loginWithProvider,
    handleAuthCallback,
    logout,
  };
}