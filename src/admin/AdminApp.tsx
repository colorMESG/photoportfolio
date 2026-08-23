import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./auth/AuthProvider";
import RequireAdmin from "./auth/RequireAdmin";
import AdminShell from "./components/AdminShell";
import DashboardPage from "./pages/DashboardPage";
import LoginPage from "./pages/LoginPage";
import GalleryPage from "./pages/GalleryPage";
import ProjectEditorPage from "./pages/ProjectEditorPage";
import ProjectsListPage from "./pages/ProjectsListPage";
import ContentPage from "./pages/ContentPage";
import { NotFoundPage } from "./pages/StubPages";
import SettingsPage from "./pages/SettingsPage";

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

              {/* The three kinds share one table, so they share one pair of
                  screens; only the `kind` differs. */}
              <Route path="projects">
                <Route index element={<ProjectsListPage kind="photography" />} />
                <Route path=":id" element={<ProjectEditorPage kind="photography" />} />
              </Route>
              <Route path="flycam">
                <Route index element={<ProjectsListPage kind="flycam" />} />
                <Route path=":id" element={<ProjectEditorPage kind="flycam" />} />
              </Route>
              <Route path="corporate">
                <Route index element={<ProjectsListPage kind="corporate" />} />
                <Route path=":id" element={<ProjectEditorPage kind="corporate" />} />
              </Route>

              <Route path="gallery" element={<GalleryPage />} />
              <Route path="about" element={<ContentPage />} />
              <Route path="content" element={<Navigate to="/about" replace />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
