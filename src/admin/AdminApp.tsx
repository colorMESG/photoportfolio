import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./auth/AuthProvider";
import RequireAdmin from "./auth/RequireAdmin";
import AdminShell from "./components/AdminShell";
import DashboardPage from "./pages/DashboardPage";
import LoginPage from "./pages/LoginPage";
import {
  ContentPage,
  CorporatePage,
  FlycamPage,
  GalleryPage,
  NotFoundPage,
  ProjectsPage,
  SettingsPage,
} from "./pages/StubPages";

/**
 * Entry point for everything under /admin.
 *
 * Loaded lazily from main.tsx, which is what keeps react-router, the Supabase
 * client and every admin screen out of the bundle a public visitor downloads.
 * The router lives here rather than at the root for the same reason, with
 * `basename` making every path below relative to /admin.
 */
export default function AdminApp() {
  return (
    <BrowserRouter basename="/admin">
      <AuthProvider>
        <Routes>
          <Route path="login" element={<LoginPage />} />
          <Route element={<RequireAdmin />}>
            <Route element={<AdminShell />}>
              <Route index element={<DashboardPage />} />
              <Route path="projects" element={<ProjectsPage />} />
              <Route path="flycam" element={<FlycamPage />} />
              <Route path="corporate" element={<CorporatePage />} />
              <Route path="gallery" element={<GalleryPage />} />
              <Route path="content" element={<ContentPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
