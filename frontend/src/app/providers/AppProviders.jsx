/**
 * AppProviders.jsx — GLOBAL STATE PROVIDERS
 *
 * Composes all context providers that the app needs. Providers make shared
 * state (like the current user or notifications) available to every component.
 *
 * Provider nesting order matters: AuthProvider must wrap NotificationProvider
 * because notifications need to know which user is logged in.
 */

import { AuthProvider } from "../../features/auth/providers/AuthProvider";
import { NotificationProvider } from "../../features/notifications/providers/NotificationProvider";

export function AppProviders({ children }) {
  return (
    <AuthProvider>
      <NotificationProvider>{children}</NotificationProvider>
    </AuthProvider>
  );
}