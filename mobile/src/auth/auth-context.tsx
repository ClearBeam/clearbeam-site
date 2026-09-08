/**
 * Owner session state.
 *
 * The token is persisted with expo-secure-store, so the owner stays logged in
 * across app restarts until they log out or the token is rejected (a 401 from
 * any authed request calls `signOut()` via the client's unauthorized handler).
 */
import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import * as SecureStore from "expo-secure-store";
import { login as loginRequest } from "@/api/auth";
import { setAuthToken, setUnauthorizedHandler } from "@/api/client";

const TOKEN_KEY = "clearbeam.session.token";
const EMAIL_KEY = "clearbeam.session.email";

type Session = { token: string; email: string };

type AuthState =
  | { status: "loading"; session: null }
  | { status: "authenticated"; session: Session }
  | { status: "anonymous"; session: null };

type AuthContextValue = AuthState & {
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: "loading", session: null });
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  // Restore a stored session on launch.
  useEffect(() => {
    (async () => {
      try {
        const [token, email] = await Promise.all([
          SecureStore.getItemAsync(TOKEN_KEY),
          SecureStore.getItemAsync(EMAIL_KEY),
        ]);
        if (!mounted.current) return;
        if (token) {
          setAuthToken(token);
          setState({ status: "authenticated", session: { token, email: email ?? "" } });
        } else {
          setState({ status: "anonymous", session: null });
        }
      } catch {
        if (mounted.current) setState({ status: "anonymous", session: null });
      }
    })();
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    async function persist(session: Session) {
      setAuthToken(session.token);
      await Promise.all([
        SecureStore.setItemAsync(TOKEN_KEY, session.token),
        SecureStore.setItemAsync(EMAIL_KEY, session.email),
      ]);
    }

    async function clear() {
      setAuthToken(null);
      await Promise.all([
        SecureStore.deleteItemAsync(TOKEN_KEY),
        SecureStore.deleteItemAsync(EMAIL_KEY),
      ]);
    }

    return {
      ...state,
      async signIn(email, password) {
        const res = await loginRequest(email, password);
        const session = { token: res.token, email: res.email };
        await persist(session);
        if (mounted.current) setState({ status: "authenticated", session });
      },
      async signOut() {
        await clear();
        if (mounted.current) setState({ status: "anonymous", session: null });
      },
    };
  }, [state]);

  // Let a 401 anywhere in the app force a logout.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      void value.signOut();
    });
    return () => setUnauthorizedHandler(null);
  }, [value]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
