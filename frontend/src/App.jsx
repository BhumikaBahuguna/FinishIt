/**
 * App.jsx — ROOT COMPONENT
 *
 * This is the top-level React component. It wraps the entire application with:
 * 1. AppErrorBoundary — catches runtime crashes and shows a recovery screen
 * 2. AppProviders — provides authentication and notification state to all pages
 * 3. AppRouter — handles page navigation (which URL shows which page)
 *
 * Think of it as: ErrorBoundary > Providers > Router > Pages
 */

import { AppProviders } from "./app/providers/AppProviders";
import { AppRouter } from "./app/router/AppRouter";
import { AppErrorBoundary } from "./shared/components/ui/AppErrorBoundary";

export default function App() {
  return (
    <AppErrorBoundary>
      <AppProviders>
        <AppRouter />
      </AppProviders>
    </AppErrorBoundary>
  );
}