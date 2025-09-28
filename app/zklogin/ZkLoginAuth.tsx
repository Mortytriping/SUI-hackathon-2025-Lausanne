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
      <Card className="max-w-md mx-auto bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 transition-colors duration-200">
        <CardHeader>
          <CardTitle className="text-center text-gray-900 dark:text-white transition-colors duration-200">
            Welcome!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900 dark:text-white transition-colors duration-200">
              {user.name || user.email}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 transition-colors duration-200">
              {user.email}
            </div>
          </div>
          
          <Button 
            onClick={logout} 
            variant="outline" 
            className="w-full border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
          >
            Logout
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-md mx-auto bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 transition-colors duration-200">
      <CardHeader>
        <CardTitle className="text-center text-gray-900 dark:text-white transition-colors duration-200">
          Sign In with zkLogin
        </CardTitle>
        <p className="text-center text-sm text-gray-600 dark:text-gray-400 transition-colors duration-200">
          Secure authentication without exposing your private keys
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {!configValidation.isValid && (
          <Alert className="border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20 transition-colors duration-200">
            <AlertDescription className="text-sm text-orange-700 dark:text-orange-300 transition-colors duration-200">
              <strong>Configuration Required:</strong>
              <ul className="list-disc list-inside mt-2">
                {configValidation.errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
              <p className="mt-2 text-xs">
                Please set up your Google OAuth credentials in{" "}
                <code className="bg-orange-100 dark:bg-orange-800/50 px-1 rounded text-orange-800 dark:text-orange-200 transition-colors duration-200">
                  .env.local
                </code>
              </p>
            </AlertDescription>
          </Alert>
        )}

        <Button
          onClick={() => loginWithProvider("google")}
          disabled={isLoading || !configValidation.isValid}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white transition-colors duration-200"
        >
          {isLoading ? "Connecting..." : "Sign in with Google"}
        </Button>
        
        <div className="text-xs text-center text-gray-500 dark:text-gray-400 transition-colors duration-200">
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