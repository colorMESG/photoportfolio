import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./AuthProvider";

/**
 * Route guard for the admin subtree.
 *
 * This is a usability boundary, not a security one — the bundle and the anon key
 * are public, so the enforcement that matters lives in the RLS policies. Its job
 * is to send unauthenticated visitors to the login form and to explain the
 * "signed in but not an admin" case instead of letting writes fail cryptically.
 */
export default function RequireAdmin() {
  const { status, isAdmin, configured } = useAuth();
  const location = useLocation();

  if (!configured) {
    return (
      <Notice title="Supabase is not configured">
        Set <Code>VITE_SUPABASE_URL</Code> and <Code>VITE_SUPABASE_ANON_KEY</Code> in{" "}
        <Code>.env.local</Code>, then restart the dev server. See{" "}
        <Code>.env.example</Code>. The public site is unaffected and keeps serving
        its static content.
      </Notice>
    );
  }

  if (status === "loading") {
    return (
      <div className="grid min-h-screen place-items-center bg-neutral-950 text-sm text-neutral-500">
        Checking session…
      </div>
    );
  }

  if (status === "signedOut") {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (!isAdmin) {
    return (
      <Notice title="This account is not an administrator">
        Sign-in succeeded, but the account has no row in the <Code>admins</Code>{" "}
        table, so the database will refuse every write. Run{" "}
        <Code>supabase/migrations/0003_bootstrap_admin.sql</Code> with this
        address to grant access.
      </Notice>
    );
  }

  return <Outlet />;
}

function Notice({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen place-items-center bg-neutral-950 px-6">
      <div className="max-w-md space-y-3 text-sm leading-relaxed text-neutral-400">
        <h1 className="text-base font-medium text-neutral-100">{title}</h1>
        <p>{children}</p>
      </div>
    </div>
  );
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded bg-neutral-800 px-1.5 py-0.5 text-[0.85em] text-neutral-200">
      {children}
    </code>
  );
}
