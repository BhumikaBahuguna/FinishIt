import { NavLink } from "react-router-dom";
import { useAuth } from "../../../features/auth/hooks/useAuth";
import { useNotifications } from "../../../features/notifications/hooks/useNotifications";
import { Button } from "../ui/Button";

const navigationItems = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/tasks", label: "Task Management" },
  { to: "/habits", label: "Habit Tracking" },
  { to: "/calendar", label: "Calendar Integration" },
  { to: "/analytics", label: "Analytics" },
  { to: "/notifications", label: "Notifications" }
];

export function AppSidebar() {
  const { user, signOut } = useAuth();
  const { notifications } = useNotifications();

  const hasImportantUnread = notifications.some(
    (n) => !n.isRead && (n.severity === "critical" || n.severity === "warning")
  );

  async function handleSignOut() {
    await signOut();
  }

  return (
    <aside className="app-sidebar">
      <div className="brand-block">
        <h1 className="brand-title">FinishIt</h1>
        <p className="brand-subtitle">Productivity Management</p>
      </div>

      <nav aria-label="Primary">
        <ul className="nav-list">
          {navigationItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  isActive ? "nav-link nav-link-active" : "nav-link"
                }
              >
                {item.label}
                {item.to === "/notifications" && hasImportantUnread && (
                  <span className="blinking-dot" aria-hidden="true" />
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="sidebar-footer">
        <p className="session-user">{user?.email ?? "Signed in user"}</p>
        <Button variant="secondary" onClick={handleSignOut}>
          Sign Out
        </Button>
      </div>
    </aside>
  );
}