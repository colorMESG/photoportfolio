import type { Session, User } from "@supabase/supabase-js";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { isSupabaseConfigured } from "../../lib/env";
import { getSupabase } from "../../lib/supabase";

type AuthStatus = "loading" | "signedOut" | "signedIn";

interface AuthValue {
  status: AuthStatus;
  session: Session | null;
  user: User | null;
  /**
   * Whether this user has a row in `admins`. Signing in successfully is not the
   * same as being an admin: any credential Supabase accepts produces a session,
   * but only listed users can write. Checking it lets the UI say so plainly
   * instead of letting every save fail with a policy error.
   */
  isAdmin: boolean;
  configured: boolean;
  signIn: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const supabase = getSupabase();
  const [status, setStatus] = useState<AuthStatus>(
    isSupabaseConfigured ? "loading" : "signedOut"
  );
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const mounted = useRef(true);

  const checkAdmin = useCallback(
    async (userId: string | undefined) => {
      if (!supabase || !userId) return false;
      // A non-admin reads zero rows here rather than getting an error, because
      // the select policy on `admins` is itself `is_admin()`.
      const { data } = await supabase
        .from("admins")
        .select("user_id")
        .eq("user_id", userId)
        .maybeSingle();
      return Boolean(data);
    },
    [supabase]
  );

  useEffect(() => {
    mounted.current = true;
    if (!supabase) return;

    void (async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted.current) return;
      const next = data.session;
      setSession(next);
      setIsAdmin(await checkAdmin(next?.user.id));
      if (!mounted.current) return;
      setStatus(next ? "signedIn" : "signedOut");
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      if (!mounted.current) return;
      setSession(next);
      setStatus(next ? "signedIn" : "signedOut");
      void checkAdmin(next?.user.id).then((ok) => {
        if (mounted.current) setIsAdmin(ok);
      });
    });

    return () => {
      mounted.current = false;
      sub.subscription.unsubscribe();
    };
  }, [supabase, checkAdmin]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      if (!supabase) return "Supabase is not configured.";
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return error ? error.message : null;
    },
    [supabase]
  );

  const signOut = useCallback(async () => {
    await supabase?.auth.signOut();
  }, [supabase]);

  const value = useMemo<AuthValue>(
    () => ({
      status,
      session,
      user: session?.user ?? null,
      isAdmin,
      configured: isSupabaseConfigured,
      signIn,
      signOut,
    }),
    [status, session, isAdmin, signIn, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>.");
  return ctx;
}
