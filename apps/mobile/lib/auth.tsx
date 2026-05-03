import { createContext, useCallback, useContext, useEffect, useState } from "react";
import * as SecureStore from "expo-secure-store";

import { data } from "@mwrd/shared";
import type { User } from "@mwrd/shared";

const TOKEN_KEY = "mwrd_session_mobile";
const SESSION_MAX_MS = 24 * 60 * 60 * 1000; // 24 h per CLAUDE.md

export interface SignInInput {
  email: string;
  password: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
}

export interface AuthContextValue extends AuthState {
  signIn: (input: SignInInput) => Promise<{ ok: boolean; error?: string }>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue>({
  user: null,
  token: null,
  loading: true,
  signIn: async () => ({ ok: false }),
  signOut: async () => undefined,
});

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    loading: true,
  });

  // Rehydrate on mount
  useEffect(() => {
    void (async () => {
      try {
        const stored = await SecureStore.getItemAsync(TOKEN_KEY);
        if (!stored) {
          setState({ user: null, token: null, loading: false });
          return;
        }
        const { token, storedAt } = JSON.parse(stored) as {
          token: string;
          storedAt: number;
        };
        if (Date.now() - storedAt > SESSION_MAX_MS) {
          await SecureStore.deleteItemAsync(TOKEN_KEY);
          setState({ user: null, token: null, loading: false });
          return;
        }
        const user = await data.getUserByToken(token);
        if (!user) {
          await SecureStore.deleteItemAsync(TOKEN_KEY);
          setState({ user: null, token: null, loading: false });
          return;
        }
        setState({ user, token, loading: false });
      } catch {
        setState({ user: null, token: null, loading: false });
      }
    })();
  }, []);

  const signIn = useCallback(async ({ email, password }: SignInInput) => {
    try {
      const result = await data.signIn({ email, password });
      if (result.user.role !== "client" && result.user.role !== "supplier") {
        return {
          ok: false,
          error: "Backoffice users must sign in at backoffice.mwrd.io.",
        };
      }
      if (result.user.activation_status !== "activated") {
        return {
          ok: false,
          error: "Account not activated. Check your email for the activation link.",
        };
      }
      await SecureStore.setItemAsync(
        TOKEN_KEY,
        JSON.stringify({ token: result.session_token, storedAt: Date.now() }),
      );
      setState({ user: result.user, token: result.session_token, loading: false });
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err instanceof Error ? err.message : "Sign-in failed" };
    }
  }, []);

  const signOut = useCallback(async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    setState({ user: null, token: null, loading: false });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
