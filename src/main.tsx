import React, { lazy, Suspense } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// The admin subtree is chosen here, before any router mounts, so that neither
// react-router, the Supabase client, nor the admin screens end up in the bundle
// a public visitor downloads. AdminApp owns its own router under /admin.
const AdminApp = lazy(() => import('./admin/AdminApp'))

const isAdminRoute = window.location.pathname.startsWith('/admin')

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {isAdminRoute ? (
      <Suspense fallback={<div className="min-h-screen bg-neutral-950" />}>
        <AdminApp />
      </Suspense>
    ) : (
      <App />
    )}
  </React.StrictMode>,
)
