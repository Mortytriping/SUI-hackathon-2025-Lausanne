"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useZkLogin } from "./useZkLogin";
import { validateZkLoginConfig } from "./config";

export function ZkLoginAuth() {
  const { isLoading, user, isAuthenticated, loginWithProvider, logout } = useZkLogin();
  const configValidation = validateZkLoginConfig();

  if (isAuthenticated && user) {
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-center">Welcome! 👋</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <div className="text-lg font-semibold">{user.name || user.email}</div>
            <div className="text-sm text-gray-600">{user.email}</div>
          </div>
          
          <Button 
            onClick={logout} 
            variant="outline" 
            className="w-full"
          >
            Logout
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center">Sign In with zkLogin 🔐</CardTitle>
        <p className="text-center text-sm text-gray-600">
          Secure authentication without exposing your private keys
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {!configValidation.isValid && (
          <Alert className="border-orange-200 bg-orange-50">
            <AlertDescription className="text-sm">
              <strong>Configuration Required:</strong>
              <ul className="list-disc list-inside mt-2">
                {configValidation.errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
              <p className="mt-2 text-xs">
                Please set up your Google OAuth credentials in <code>.env.local</code>
              </p>
            </AlertDescription>
          </Alert>
        )}

        <Button
          onClick={() => loginWithProvider("google")}
          disabled={isLoading || !configValidation.isValid}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
        >
          {isLoading ? "Connecting..." : "Sign in with Google"}
        </Button>
        
        <div className="text-xs text-center text-gray-500">
          <p>zkLogin provides:</p>
          <ul className="list-disc list-inside text-left mt-2 space-y-1">
            <li>Privacy-preserving authentication</li>
            <li>No need to manage private keys</li>
            <li>Secure interaction with Sui blockchain</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}