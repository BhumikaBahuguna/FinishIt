/**
 * NotificationsPage.jsx — NOTIFICATIONS & REMINDERS PAGE (/notifications)
 *
 * Redesigned premium notification center featuring:
 *   - 5 KPI summary cards with glassmorphism styling
 *   - Priority Deadlines section with action buttons
 *   - Notification rows grouped by type (overdue, missed habits, reminders)
 *   - Refresh and Mark All Read controls
 */

import { Link } from "react-router-dom";
import { useNotifications } from "../hooks/useNotifications";

const NOTIF_ICONS = {
  overdue_task: "📅",
  upcoming_task_deadline: "📅",
  missed_habit: "🔥",
  daily_reminder: "🔔"
};

const NOTIF_ACCENT = {
  overdue_task: { border: "#ff1744", bg: "rgba(255, 23, 68, 0.05)" },
  upcoming_task_deadline: { border: "#ff6b00", bg: "rgba(255, 107, 0, 0.05)" },
  missed_habit: { border: "#b975ff", bg: "rgba(185, 117, 255, 0.05)" },
  daily_reminder: { border: "#00e5ff", bg: "rgba(0, 229, 255, 0.05)" }
};

function getActionButtons(notification, markAsRead) {
  if (notification.type === "overdue_task" || notification.type === "upcoming_task_deadline") {
    return (
      <>
        <Link to={notification.route ?? "/tasks"} className="notif-row__btn">Open</Link>
        {!notification.isRead && (
          <button className="notif-row__btn notif-row__btn--resolve" onClick={() => markAsRead(notification.id)}>
            Resolve
          </button>
        )}
      </>
    );
  }

  if (notification.type === "missed_habit") {
    return (
      <>
        <Link to="/habits" className="notif-row__btn notif-row__btn--rebuild">Rebuild Consistency</Link>
        {!notification.isRead && (
          <button className="notif-row__btn" onClick={() => markAsRead(notification.id)}>
            Acknowledge
          </button>
        )}
      </>
    );
  }

  return (
    <>
      <Link to={notification.route ?? "/dashboard"} className="notif-row__btn">Open</Link>
      {!notification.isRead && (
        <button className="notif-row__btn" onClick={() => markAsRead(notification.id)}>
          Dismiss
        </button>
      )}
    </>
  );
}

function getSubtitle(notification) {
  if (notification.type === "overdue_task") {
    return `Deadline: ${new Date(notification.createdAt).toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })}`;
  }
  if (notification.type === "missed_habit") {
    return notification.message;
  }
  return notification.message;
}

function getBadge(notification) {
  if (notification.type === "overdue_task") {
    const match = notification.message.match(/(\d+) day/);
    const days = match ? match[1] : "?";
    return { icon: "📅", text: `Missed by ${days} day(s)`, cls: "notif-badge--red" };
  }
  if (notification.type === "upcoming_task_deadline") {
    return { icon: "⏰", text: notification.message, cls: "notif-badge--orange" };
  }
  if (notification.type === "missed_habit") {
    const streakMatch = notification.message.match(/streak is (\d+)/);
    const streak = streakMatch ? streakMatch[1] : "0";
    return { icon: "🔥", text: `Streak broken at ${streak}`, cls: "notif-badge--purple" };
  }
  return { icon: "📋", text: notification.message, cls: "notif-badge--cyan" };
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
    <div className="notif-page">
      {/* Header */}
      <header className="notif-page__header">
        <h1 className="notif-page__title">NOTIFICATIONS & REMINDERS</h1>
      </header>

      {/* KPI Cards Row */}
      <div className="notif-kpi-row">
        <div className="notif-kpi-card notif-kpi-card--cyan">
          <div className="notif-kpi-card__top">
            <span className="notif-kpi-card__label">UNREAD NOTIFICATIONS</span>
            <span className="notif-kpi-card__icon">🔔</span>
          </div>
          <p className="notif-kpi-card__value">{unreadCount}</p>
        </div>

        <div className="notif-kpi-card notif-kpi-card--blue">
          <div className="notif-kpi-card__top">
            <span className="notif-kpi-card__label">UPCOMING DEADLINES</span>
            <span className="notif-kpi-card__icon">📅</span>
          </div>
          <p className="notif-kpi-card__value">{stats.upcomingDeadlines}</p>
        </div>

        <div className="notif-kpi-card notif-kpi-card--orange">
          <div className="notif-kpi-card__top">
            <span className="notif-kpi-card__label">OVERDUE TASKS</span>
            <span className="notif-kpi-card__icon">⚠️</span>
          </div>
          <p className="notif-kpi-card__value">{stats.overdueTasks}</p>
        </div>

        <div className="notif-kpi-card notif-kpi-card--purple">
          <div className="notif-kpi-card__top">
            <span className="notif-kpi-card__label">MISSED HABITS</span>
            <span className="notif-kpi-card__icon">🔕</span>
          </div>
          <p className="notif-kpi-card__value">{stats.missedHabits}</p>
        </div>

        <div className="notif-kpi-card notif-kpi-card--green">
          <div className="notif-kpi-card__top">
            <span className="notif-kpi-card__label">DAILY REMINDERS</span>
            <span className="notif-kpi-card__icon">☑️</span>
          </div>
          <p className="notif-kpi-card__value">{stats.dailyReminders}</p>
        </div>
      </div>

      {/* Section header with actions */}
      <div className="notif-section-header">
        <h2 className="notif-section-header__title">PRIORITY DEADLINES</h2>
        <div className="notif-section-header__actions">
          <button className="notif-header-btn" onClick={refreshNotifications}>
            🔄 Refresh
          </button>
          <button className="notif-header-btn notif-header-btn--primary" onClick={markAllAsRead}>
            Mark All Read
          </button>
        </div>
      </div>

      {/* Error / Loading */}
      {errorMessage && <p className="status-error">{errorMessage}</p>}
      {isLoading && (
        <div className="dashboard-loading">
          <div className="dashboard-loading__spinner" />
          <p>Loading notifications...</p>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && notifications.length === 0 && (
        <div className="notif-empty">
          <p className="notif-empty__icon">🎉</p>
          <p className="notif-empty__text">All clear! No active notifications.</p>
        </div>
      )}

      {/* Notification Rows */}
      {!isLoading && notifications.length > 0 && (
        <div className="notif-list">
          {notifications.map((notification) => {
            const accent = NOTIF_ACCENT[notification.type] || NOTIF_ACCENT.daily_reminder;
            const icon = NOTIF_ICONS[notification.type] || "📋";
            const badge = getBadge(notification);
            const subtitle = getSubtitle(notification);

            return (
              <div
                key={notification.id}
                className={`notif-row ${notification.isRead ? "notif-row--read" : ""}`}
                style={{
                  borderLeftColor: accent.border,
                  background: notification.isRead ? "transparent" : accent.bg
                }}
              >
                {/* Icon */}
                <div className="notif-row__icon" style={{ color: accent.border }}>
                  {icon}
                </div>

                {/* Body */}
                <div className="notif-row__body">
                  <h3 className="notif-row__title">{notification.title.replace(/^(Overdue task:|Upcoming deadline:|Missed habit:|Daily productivity reminder)/, "").trim() || notification.title}</h3>
                  <p className="notif-row__subtitle">{subtitle}</p>
                </div>

                {/* Badge */}
                <div className={`notif-badge ${badge.cls}`}>
                  <span className="notif-badge__icon">{badge.icon}</span>
                  <span>{badge.text}</span>
                </div>

                {/* Actions */}
                <div className="notif-row__actions">
                  {getActionButtons(notification, markAsRead)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
