import { useState, type FormEvent } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";

export default function LoginPage() {
  const { status, signIn, configured } = useAuth();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (status === "signedIn") {
    const from = (location.state as { from?: string } | null)?.from;
    return <Navigate to={from && from !== "/login" ? from : "/"} replace />;
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const message = await signIn(email.trim(), password);
    setBusy(false);
    if (message) setError(message);
  }

  return (
    <div className="grid min-h-screen place-items-center bg-neutral-950 px-6">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-5">
        <header className="space-y-1">
          <h1 className="text-lg font-medium text-neutral-100">Portfolio admin</h1>
          <p className="text-sm text-neutral-500">Sign in to manage the portfolio.</p>
        </header>

        <label className="block space-y-1.5">
          <span className="text-xs font-medium tracking-wide text-neutral-400 uppercase">
            Email
          </span>
          <input
            type="email"
            required
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-neutral-600"
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-xs font-medium tracking-wide text-neutral-400 uppercase">
            Password
          </span>
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-neutral-600"
          />
        </label>

        {error && (
          <p role="alert" className="text-sm text-red-400">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={busy || !configured}
          className="w-full rounded-md bg-neutral-100 px-3 py-2 text-sm font-medium text-neutral-900 transition-colors hover:bg-white disabled:opacity-40"
        >
          {busy ? "Signing in…" : "Sign in"}
        </button>

        {!configured && (
          <p className="text-sm text-neutral-500">
            Supabase is not configured, so sign-in is unavailable. Populate
            <code className="mx-1 rounded bg-neutral-800 px-1.5 py-0.5 text-neutral-300">
              .env.local
            </code>
            and restart the dev server.
          </p>
        )}

        <p className="text-xs text-neutral-600">
          Accounts are created by the site owner. There is no public registration.
        </p>
      </form>
    </div>
  );
}
