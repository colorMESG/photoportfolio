import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";

// Paths are relative to the router's /admin basename.
const NAV = [
  { to: "/", label: "Dashboard", end: true },
  { to: "/projects", label: "Projects" },
  { to: "/flycam", label: "Flycam" },
  { to: "/corporate", label: "Corporate" },
  { to: "/gallery", label: "Personal Gallery" },
  { to: "/content", label: "About / Content" },
  { to: "/settings", label: "Site Settings" },
];

export default function AdminShell() {
  const { user, signOut } = useAuth();

  return (
    <div className="admin-root flex min-h-screen bg-neutral-950 text-neutral-200">
      <aside className="flex w-60 shrink-0 flex-col border-r border-neutral-800 p-4">
        <div className="px-2 py-3">
          <p className="text-sm font-medium text-neutral-100">Portfolio admin</p>
          <p className="truncate text-xs text-neutral-500">{user?.email}</p>
        </div>

        <nav className="mt-4 flex flex-1 flex-col gap-0.5">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `rounded-md px-2.5 py-2 text-sm transition-colors ${
                  isActive
                    ? "bg-neutral-800 text-neutral-100"
                    : "text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="space-y-1 border-t border-neutral-800 pt-3">
          <a
            href="/"
            className="block rounded-md px-2.5 py-2 text-sm text-neutral-400 transition-colors hover:bg-neutral-900 hover:text-neutral-200"
          >
            View site ↗
          </a>
          <button
            type="button"
            onClick={() => void signOut()}
            className="w-full rounded-md px-2.5 py-2 text-left text-sm text-neutral-400 transition-colors hover:bg-neutral-900 hover:text-neutral-200"
          >
            Sign out
          </button>
        </div>
      </aside>

      <main className="min-w-0 flex-1 overflow-y-auto p-8">
        <Outlet />
      </main>
    </div>
  );
}
