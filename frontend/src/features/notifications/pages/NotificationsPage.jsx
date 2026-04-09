/**
 * NotificationsPage.jsx — NOTIFICATIONS PAGE (/notifications)
 *
 * Full notification history with KPI stats, refresh/mark-all-read buttons,
 * and a scrollable list of all notifications with read/unread state.
 */

import { Link } from "react-router-dom";
import { useNotifications } from "../hooks/useNotifications";
import { PageHeader } from "../../../shared/components/ui/PageHeader";
import { Card } from "../../../shared/components/ui/Card";

function getSeverityLabel(type) {
  if (type === "upcoming_task_deadline") return "Upcoming Deadline";
  if (type === "overdue_task") return "Overdue Task";
  if (type === "missed_habit") return "Missed Habit";
  if (type === "daily_reminder") return "Daily Reminder";
  return "Notification";
}

export function NotificationsPage() {
  const {
    notifications,
    stats,
    unreadCount,
    isLoading,
    errorMessage,
    markAsRead,
    markAllAsRead,
    refreshNotifications
  } = useNotifications();

  return (
    <div className="page-content">
      <PageHeader
        title="Notifications and Reminders"
        subtitle="Stay on top of deadlines, habits, and daily planning reminders."
      />

      <section className="kpi-grid">
        <Card>
          <p className="kpi-label">Unread Notifications</p>
          <p className="kpi-value">{unreadCount}</p>
        </Card>
        <Card>
          <p className="kpi-label">Upcoming Deadlines</p>
          <p className="kpi-value">{stats.upcomingDeadlines}</p>
        </Card>
        <Card>
          <p className="kpi-label">Overdue Tasks</p>
          <p className="kpi-value">{stats.overdueTasks}</p>
        </Card>
      </section>

      <section className="kpi-grid">
        <Card>
          <p className="kpi-label">Missed Habits</p>
          <p className="kpi-value">{stats.missedHabits}</p>
        </Card>
        <Card>
          <p className="kpi-label">Daily Reminders</p>
          <p className="kpi-value">{stats.dailyReminders}</p>
        </Card>
        <Card>
          <div className="actions-row compact-top-gap">
            <button type="button" className="btn btn-secondary" onClick={refreshNotifications}>
              Refresh
            </button>
            <button type="button" className="btn btn-secondary" onClick={markAllAsRead}>
              Mark All Read
            </button>
          </div>
        </Card>
      </section>

      {errorMessage ? <p className="status-error">{errorMessage}</p> : null}
      {isLoading ? <p>Loading notifications...</p> : null}

      <Card title="All Notifications">
        {!isLoading && notifications.length === 0 ? (
          <p>No active notifications.</p>
        ) : null}

        {notifications.length > 0 ? (
          <ul className="notification-list">
            {notifications.map((notification) => (
              <li
                key={notification.id}
                className={notification.isRead ? "notification-item is-read" : "notification-item"}
              >
                <div className="notification-item-body">
                  <p className="notification-tag">{getSeverityLabel(notification.type)}</p>
                  <h3>{notification.title}</h3>
                  <p className="data-list-meta">{notification.message}</p>
                </div>

                <div className="notification-item-actions">
                  <Link to={notification.route ?? "/dashboard"} className="notification-link">
                    Open
                  </Link>
                  {!notification.isRead ? (
                    <button
                      type="button"
                      className="notification-link"
                      onClick={() => markAsRead(notification.id)}
                    >
                      Mark read
                    </button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        ) : null}
      </Card>
    </div>
  );
}
