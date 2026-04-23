/**
 * ProtectedRoute.jsx — AUTH GUARD FOR PROTECTED PAGES
 *
 * This component wraps all routes that require the user to be logged in.
 * If the user is not authenticated, they get redirected to /login.
 * If Supabase is not configured, it shows a configuration warning.
 * While loading, it shows a loading indicator.
 */

import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export function ProtectedRoute() {
  const { isLoading, isProfileReady, session, isSupabaseConfigured } = useAuth();

  if (!isSupabaseConfigured) {
    return (
      <div className="status-page">
        <h1>Supabase Configuration Required</h1>
        <p>Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to enable authentication.</p>
      </div>
    );
  }

  if (isLoading || !isProfileReady) {
    return (
      <div className="status-page">
        <p>Loading profile...</p>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
