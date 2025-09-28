import { getFullnodeUrl, SuiClient } from "@mysten/sui/client";

// zkLogin configuration
export const ZKLOGIN_CONFIG = {
  // OAuth providers
  providers: {
    google: {
      clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "",
      redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/auth/callback`,
    },
    facebook: {
      clientId: process.env.NEXT_PUBLIC_FACEBOOK_CLIENT_ID || "",
      redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/auth/callback`,
    },
  },
  
  // Sui network configuration
  network: "testnet" as const,
  suiClient: new SuiClient({ url: getFullnodeUrl("testnet") }),
  
  // Salt for address generation (should be stored securely in production)
  salt: process.env.NEXT_PUBLIC_ZKLOGIN_SALT || "default-salt-change-in-production",
  
  // Prover endpoint for proof generation
  proverUrl: "https://prover-dev.mystenlabs.com/v1",
};

export type ZkLoginProvider = keyof typeof ZKLOGIN_CONFIG.providers;

// Validation function
export function validateZkLoginConfig(): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!ZKLOGIN_CONFIG.providers.google.clientId) {
    errors.push("NEXT_PUBLIC_GOOGLE_CLIENT_ID is required");
  }
  
  if (!ZKLOGIN_CONFIG.salt || ZKLOGIN_CONFIG.salt === "default-salt-change-in-production") {
    errors.push("NEXT_PUBLIC_ZKLOGIN_SALT should be set to a secure random value");
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}