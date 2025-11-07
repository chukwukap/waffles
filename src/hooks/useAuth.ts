"use client";

import { useState, useCallback } from "react";
import { sdk } from "@farcaster/miniapp-sdk";
import { env } from "@/lib/env";

export function useAuth() {
  const [token, setToken] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  /**
   * Authenticate the user and get a JWT token
   * This will prompt the user to sign with their Farcaster account
   */
  const signIn = useCallback(async (): Promise<string | null> => {
    if (token) {
      return token; // Already authenticated
    }

    setIsAuthenticating(true);
    try {
      const { token: newToken } = await sdk.quickAuth.getToken();
      setToken(newToken);
      return newToken;
    } catch (error) {
      console.error("Authentication failed:", error);
      return null;
    } finally {
      setIsAuthenticating(false);
    }
  }, [token]);

  /**
   * Sign out the user (clear the token)
   */
  const signOut = useCallback(() => {
    setToken(null);
  }, []);

  /**
   * Get the current token (may be null if not authenticated)
   */
  const getToken = useCallback(() => {
    return token;
  }, [token]);

  /**
   * Check if user is authenticated
   */
  const isAuthenticated = token !== null;

  return {
    token,
    isAuthenticated,
    isAuthenticating,
    signIn,
    signOut,
    getToken,
  };
}

/**
 * Authenticate and fetch user data from the backend
 * This verifies the token with the backend and returns the authenticated FID
 */
export async function authenticateAndGetFid(
  token: string
): Promise<number | null> {
  try {
    const response = await sdk.quickAuth.fetch(`${env.rootUrl}/api/auth`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.fid || null;
  } catch (error) {
    console.error("Failed to verify authentication:", error);
    return null;
  }
}

