"use client";

import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useState,
  ReactNode,
} from "react";

/**
 * useLayoutEffect on the client (fires before browser paint),
 * falls back to useEffect on the server (SSR/static build) to avoid warnings.
 */
const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

const WORKER_URL = process.env.NEXT_PUBLIC_WORKER_URL ?? "";

/** localStorage key used to persist the JWT between page refreshes. */
const TOKEN_KEY = "joa_token";

interface AuthContextValue {
  /** True when the owner is logged in. Guests are always false. */
  isOwner: boolean;
  /**
   * Sends credentials to the Worker POST /auth/login endpoint.
   * Stores the returned JWT in localStorage on success.
   * Throws with the server error message on failure.
   *
   * MVP — single owner only. No registration or multi-user support.
   */
  login: (username: string, password: string) => Promise<void>;
  /** Removes the JWT from localStorage and resets owner state to false. */
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Provides authentication state to the entire app.
 * Place in layout.tsx so all pages have access.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [isOwner, setIsOwner] = useState(false);

  /**
   * Reads the JWT from localStorage before the browser paints.
   * useLayoutEffect fires synchronously after DOM commit — the user
   * never sees the wrong auth state on screen.
   */
  useIsomorphicLayoutEffect(() => {
    setIsOwner(!!localStorage.getItem(TOKEN_KEY));
  }, []);

  async function login(username: string, password: string): Promise<void> {
    const response = await fetch(`${WORKER_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error((body as { error?: string }).error ?? "Login failed");
    }

    const { token } = (await response.json()) as { token: string };
    localStorage.setItem(TOKEN_KEY, token);
    setIsOwner(true);
  }

  function logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    setIsOwner(false);
  }

  return (
    <AuthContext.Provider value={{ isOwner, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

/** Returns auth context. Must be used inside a component wrapped by AuthProvider. */
export function useAuth(): AuthContextValue {
  const authContext = useContext(AuthContext);
  if (!authContext) throw new Error("useAuth must be used inside AuthProvider");
  return authContext;
}
