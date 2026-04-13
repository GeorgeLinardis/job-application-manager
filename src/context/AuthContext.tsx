"use client";

import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useState,
  ReactNode,
} from "react";
import { api } from "@/lib/api";
import { TOKEN_KEY } from "@/lib/constants";

/**
 * useLayoutEffect on the client (fires before browser paint),
 * falls back to useEffect on the server (SSR/static build) to avoid warnings.
 */
const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

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

  /**
   * Delegates to api.login() which handles the fetch and error handling.
   * Stores the returned JWT in localStorage on success.
   * Throws with the server error message on failure.
   */
  async function login(username: string, password: string): Promise<void> {
    const { token } = await api.login(username, password);
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
