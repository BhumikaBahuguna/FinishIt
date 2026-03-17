import { Link } from "react-router-dom";
import { useNotifications } from "../hooks/useNotifications";

function getSeverityClassName(severity) {
  if (severity === "critical") return "notification-item severity-critical";
  if (severity === "warning") return "notification-item severity-warning";
  return "notification-item severity-info";
}

export function NotificationCenter() {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    refreshNotifications,
    requestBrowserPermission,
    browserPermission,
    isLoading
  } = useNotifications();

  const previewNotifications = notifications.slice(0, 6);

  return (
    <section className="notification-center" aria-label="Notifications">
      <div className="notification-toolbar">
        <h2 className="notification-title">Notifications</h2>
        <span className="notification-count">{unreadCount} unread</span>
      </div>

      <div className="notification-actions">
        <button type="button" className="btn btn-secondary" onClick={refreshNotifications}>
          Refresh
        </button>
        <button type="button" className="btn btn-secondary" onClick={markAllAsRead}>
          Mark All Read
        </button>
        {browserPermission !== "granted" ? (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={requestBrowserPermission}
          >
            Enable Browser Alerts
          </button>
        ) : null}
        <Link className="btn btn-primary" to="/notifications">
          View All
        </Link>
      </div>

      {isLoading ? <p className="data-list-meta">Loading notifications...</p> : null}

      {!isLoading && previewNotifications.length === 0 ? (
        <p className="data-list-meta">No active notifications.</p>
      ) : null}

      {!isLoading && previewNotifications.length > 0 ? (
        <ul className="notification-list">
          {previewNotifications.map((notification) => (
            <li
              key={notification.id}
              className={
                notification.isRead
                  ? `${getSeverityClassName(notification.severity)} is-read`
                  : getSeverityClassName(notification.severity)
              }
            >
              <div className="notification-item-body">
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
    </section>
  );
}
