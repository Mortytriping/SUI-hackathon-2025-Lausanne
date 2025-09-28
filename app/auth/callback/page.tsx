"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useZkLogin } from "../../zklogin/useZkLogin";

export default function AuthCallback() {
  const router = useRouter();
  const { handleAuthCallback } = useZkLogin();
  const [status, setStatus] = useState<"processing" | "success" | "error">("processing");

  useEffect(() => {
    const handleCallback = async () => {
      try {
        setStatus("processing");
        
        // Extract JWT from URL fragment (Google OAuth returns it in the fragment)
        const fragment = window.location.hash.substring(1);
        const params = new URLSearchParams(fragment);
        let idToken = params.get('id_token');
        
        if (!idToken) {
          // Try query parameters as fallback
          const urlParams = new URLSearchParams(window.location.search);
          idToken = urlParams.get('id_token');
        }
        
        if (!idToken) {
          // Check for error parameters
          const error = params.get('error') || new URLSearchParams(window.location.search).get('error');
          const errorDescription = params.get('error_description') || new URLSearchParams(window.location.search).get('error_description');
          
          if (error) {
            throw new Error(`OAuth error: ${error}. ${errorDescription || ''}`);
          } else {
            throw new Error("No ID token found in callback URL. Please try logging in again.");
          }
        }
        
        console.log("Received ID token, processing authentication...");
        await handleAuthCallback(idToken);
        
        setStatus("success");
        
        // Redirect to dashboard after successful authentication
        setTimeout(() => {
          router.push("/dashboard");
        }, 2000);
      } catch (error) {
        console.error("Auth callback failed:", error);
        setStatus("error");
        
        // Show error message to user
        const errorMessage = error instanceof Error ? error.message : 'Unknown authentication error';
        alert(`Authentication failed: ${errorMessage}`);
        
        // Redirect back to login after error
        setTimeout(() => {
          router.push("/");
        }, 3000);
      }
    };

    handleCallback();
  }, [handleAuthCallback, router]);

  return (
    <div className="container mx-auto p-6 flex items-center justify-center min-h-screen">
      <div className="text-center">
        {status === "processing" && (
          <div>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold">Processing authentication...</h2>
            <p className="text-gray-600">Please wait while we verify your credentials.</p>
          </div>
        )}
        
        {status === "success" && (
          <div>
            <div className="text-green-600 text-4xl mb-4">✅</div>
            <h2 className="text-xl font-semibold text-green-600">Authentication successful!</h2>
            <p className="text-gray-600">Redirecting to your dashboard...</p>
          </div>
        )}
        
        {status === "error" && (
          <div>
            <div className="text-red-600 text-4xl mb-4">❌</div>
            <h2 className="text-xl font-semibold text-red-600">Authentication failed</h2>
            <p className="text-gray-600">Redirecting back to login...</p>
          </div>
        )}
      </div>
    </div>
  );
}