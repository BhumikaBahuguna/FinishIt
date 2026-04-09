/**
 * AppRouter.jsx — APPLICATION ROUTING
 *
 * Defines all the pages/URLs in the application using React Router.
 *
 * Route structure:
 *   - /login (public) — Login page, redirects to dashboard if already logged in
 *   - /dashboard (protected) — Main overview page
 *   - /tasks (protected) — Create, edit, delete, and prioritize tasks
 *   - /habits (protected) — Create and track daily habits
 *   - /analytics (protected) — View productivity charts and statistics
 *   - /calendar (protected) — Sync task deadlines to Google Calendar
 *   - /notifications (protected) — View all alerts and reminders
 *   - /* (catch-all) — Redirects unknown URLs to dashboard
 *
 * "Protected" means user must be logged in. "Public" means open to everyone.
 */

import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { MainLayout } from "../layouts/MainLayout";
import { LoginPage } from "../../features/auth/pages/LoginPage";
import { DashboardPage } from "../../features/dashboard/pages/DashboardPage";
import { TaskManagementPage } from "../../features/tasks/pages/TaskManagementPage";
import { HabitTrackingPage } from "../../features/habits/pages/HabitTrackingPage";
import { AnalyticsPage } from "../../features/analytics/pages/AnalyticsPage";
import { NotificationsPage } from "../../features/notifications/pages/NotificationsPage";
import { CalendarIntegrationPage } from "../../features/calendar/pages/CalendarIntegrationPage";
import { LandingPage } from "../../features/landing/pages/LandingPage";
import { ProtectedRoute } from "./ProtectedRoute";
import { PublicRoute } from "./PublicRoute";

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Now always visible to everyone */}
        <Route path="/" element={<LandingPage />} />

        <Route element={<PublicRoute />}>
          <Route path="/login" element={<LoginPage />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/tasks" element={<TaskManagementPage />} />
            <Route path="/habits" element={<HabitTrackingPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/calendar" element={<CalendarIntegrationPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}