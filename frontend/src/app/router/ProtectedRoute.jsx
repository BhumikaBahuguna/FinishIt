import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../features/auth/hooks/useAuth";

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
