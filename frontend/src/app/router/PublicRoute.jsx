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
