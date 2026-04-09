/**
 * NotificationCenter.jsx — TOPBAR NOTIFICATION BELL WIDGET
 *
 * Renders a bell icon with unread badge count in the top bar.
 * Clicking opens a dropdown showing unread notifications with dismiss/navigate actions.
 * Includes a link to the full notifications page and browser permission request.
 */

import { useState, useRef, useEffect } from "react";
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
    requestBrowserPermission,
    browserPermission,
    isLoading
  } = useNotifications();

  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Close when clicking outside the dropdown container
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Show only unread notifications initially up to a limit
  const unreadNotifications = notifications.filter((n) => !n.isRead).slice(0, 15);

  return (
    <div className="notification-dropdown-container" ref={containerRef}>
      <button 
        type="button" 
        className="notification-bell" 
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle notifications"
      >
        <span className="bell-icon">🔔</span>
        {unreadCount > 0 && <span className="bell-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-dropdown-header">
            <h3 className="notification-title">Unread</h3>
            <button type="button" className="notification-link" onClick={markAllAsRead}>
              Mark All Read
            </button>
          </div>

          <div className="notification-dropdown-body">
            {isLoading ? (
              <p className="data-list-meta" style={{ padding: "1rem", textAlign: "center" }}>Loading...</p>
            ) : unreadNotifications.length === 0 ? (
              <p className="data-list-meta" style={{ padding: "1rem", textAlign: "center" }}>All caught up!</p>
            ) : (
              <ul className="notification-list">
                {unreadNotifications.map((notification) => (
                  <li
                    key={notification.id}
                    className={getSeverityClassName(notification.severity)}
                  >
                    <div className="notification-item-body">
                      <h3>{notification.title}</h3>
                      <p className="data-list-meta">{notification.message}</p>
                    </div>

                    <div className="notification-item-actions" style={{ flexDirection: "column", gap: "0.25rem" }}>
                      <Link to={notification.route ?? "/dashboard"} className="notification-link" onClick={() => setIsOpen(false)}>
                        Go to
                      </Link>
                      <button
                        type="button"
                        className="notification-link"
                        onClick={() => markAsRead(notification.id)}
                      >
                        Dismiss
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          
          <div className="notification-dropdown-footer">
            <Link className="btn btn-secondary" style={{ width: "100%" }} to="/notifications" onClick={() => setIsOpen(false)}>
              View All History
            </Link>
            {browserPermission !== "granted" ? (
              <button
                type="button"
                className="btn btn-secondary"
                style={{ width: "100%", marginTop: "0.5rem" }}
                onClick={requestBrowserPermission}
              >
                Enable Desktop Alerts
              </button>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
