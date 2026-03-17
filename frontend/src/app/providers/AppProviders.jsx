import { AuthProvider } from "../../features/auth/providers/AuthProvider";
import { NotificationProvider } from "../../features/notifications/providers/NotificationProvider";

export function AppProviders({ children }) {
  return (
    <AuthProvider>
      <NotificationProvider>{children}</NotificationProvider>
    </AuthProvider>
  );
}