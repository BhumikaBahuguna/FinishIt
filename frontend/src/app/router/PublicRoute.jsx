/**
 * PublicRoute.jsx — AUTH GUARD FOR PUBLIC PAGES (e.g., Login)
 *
 * If a user is already logged in and tries to access /login,
 * this redirects them to /dashboard instead.
 */

import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../features/auth/hooks/useAuth";

export function PublicRoute() {
  const { isLoading, session, isSupabaseConfigured } = useAuth();

  if (!isSupabaseConfigured) {
    return <Outlet />;
  }

  if (isLoading) {
    return (
      <div className="status-page">
        <p>Loading session...</p>
      </div>
    );
  }

  if (session) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
