/**
 * MainLayout.jsx — APPLICATION SHELL LAYOUT
 *
 * This is the visual frame that wraps all protected pages.
 * Structure: Sidebar (left) + Content area (right) with topbar notification bell.
 * The <Outlet /> renders whichever page matches the current URL.
 */

import { Outlet } from "react-router-dom";
import { NotificationCenter } from "../../features/notifications/components/NotificationCenter";
import { AppSidebar } from "../../shared/components/navigation/AppSidebar";

export function MainLayout() {
  return (
    <div className="app-shell">
      <AppSidebar />

      <div className="app-content">
        <header className="app-topbar">
          <NotificationCenter />
        </header>

        <main className="app-main" aria-live="polite">
          <Outlet />
        </main>
      </div>
    </div>
  );
}