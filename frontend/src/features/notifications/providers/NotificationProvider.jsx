import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../../auth/hooks/useAuth";
import {
  getNotificationsSnapshot,
  setDailyReminderSent
} from "../services/notificationEngine";
import { NotificationContext } from "../context/NotificationContext";

const POLL_INTERVAL_MS = 60 * 1000;

function supportsBrowserNotifications() {
  return typeof window !== "undefined" && "Notification" in window;
}

function notificationPermission() {
  if (!supportsBrowserNotifications()) return "unsupported";
  return window.Notification.permission;
}

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [stats, setStats] = useState({
    upcomingDeadlines: 0,
    overdueTasks: 0,
    missedHabits: 0,
    dailyReminders: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [browserPermission, setBrowserPermission] = useState(notificationPermission());
  const [readNotificationIds, setReadNotificationIds] = useState(new Set());
  const readNotificationIdsRef = useRef(new Set());
  const publishedNotificationIdsRef = useRef(new Set());
  const isRefreshingRef = useRef(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    readNotificationIdsRef.current = readNotificationIds;
  }, [readNotificationIds]);

  const emitBrowserNotification = useCallback((notification) => {
    if (!supportsBrowserNotifications()) return;
    if (window.Notification.permission !== "granted") return;

    new window.Notification(notification.title, {
      body: notification.message
    });
  }, []);

  const publishNewNotifications = useCallback(
    (nextNotifications) => {
      const seen = publishedNotificationIdsRef.current;

      nextNotifications.forEach((notification) => {
        if (seen.has(notification.id)) return;

        seen.add(notification.id);
        emitBrowserNotification(notification);

        if (notification.type === "daily_reminder") {
          setDailyReminderSent();
        }
      });
    },
    [emitBrowserNotification]
  );

  const refreshNotifications = useCallback(async (options = {}) => {
    const silent = options.silent ?? false;

    if (isRefreshingRef.current) {
      return;
    }

    isRefreshingRef.current = true;

    if (!user?.id) {
      if (isMountedRef.current) {
        setNotifications([]);
        setStats({
          upcomingDeadlines: 0,
          overdueTasks: 0,
          missedHabits: 0,
          dailyReminders: 0
        });
        setIsLoading(false);
      }

      isRefreshingRef.current = false;
      return;
    }

    if (!silent && isMountedRef.current) {
      setIsLoading(true);
    }

    if (isMountedRef.current) {
      setErrorMessage("");
    }

    try {
      const { data, error } = await getNotificationsSnapshot(user.id);

      if (error) {
        if (isMountedRef.current) {
          setErrorMessage(error.message ?? "Unable to load notifications.");
        }
        return;
      }

      const nextNotifications = (data?.notifications ?? []).map((notification) => ({
        ...notification,
        isRead: readNotificationIdsRef.current.has(notification.id)
      }));

      if (isMountedRef.current) {
        setNotifications(nextNotifications);
        setStats(
          data?.stats ?? {
            upcomingDeadlines: 0,
            overdueTasks: 0,
            missedHabits: 0,
            dailyReminders: 0
          }
        );
      }

      publishNewNotifications(nextNotifications);
    } catch (error) {
      if (isMountedRef.current) {
        setErrorMessage(error.message ?? "Unable to load notifications.");
      }
    } finally {
      if (isMountedRef.current && !silent) {
        setIsLoading(false);
      }

      isRefreshingRef.current = false;
    }
  }, [publishNewNotifications, user?.id]);

  useEffect(() => {
    publishedNotificationIdsRef.current = new Set();
    setReadNotificationIds(new Set());
    refreshNotifications();
  }, [refreshNotifications, user?.id]);

  useEffect(() => {
    if (!user?.id) return undefined;

    const intervalId = window.setInterval(() => {
      refreshNotifications({ silent: true });
    }, POLL_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [refreshNotifications, user?.id]);

  const unreadCount = notifications.filter((notification) => !notification.isRead).length;

  const markAsRead = useCallback((notificationId) => {
    setReadNotificationIds((current) => {
      const next = new Set(current);
      next.add(notificationId);
      readNotificationIdsRef.current = next;
      return next;
    });

    setNotifications((current) =>
      current.map((notification) =>
        notification.id === notificationId ? { ...notification, isRead: true } : notification
      )
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setReadNotificationIds((current) => {
      const next = new Set(current);
      notifications.forEach((notification) => next.add(notification.id));
      readNotificationIdsRef.current = next;
      return next;
    });

    setNotifications((current) =>
      current.map((notification) => ({
        ...notification,
        isRead: true
      }))
    );
  }, [notifications]);

  const requestBrowserPermission = useCallback(async () => {
    if (!supportsBrowserNotifications()) return "unsupported";

    try {
      const permission = await window.Notification.requestPermission();
      setBrowserPermission(permission);
      return permission;
    } catch (error) {
      setErrorMessage(error.message ?? "Failed to request browser notification permission.");
      return "denied";
    }
  }, []);

  const value = useMemo(
    () => ({
      notifications,
      stats,
      unreadCount,
      isLoading,
      errorMessage,
      browserPermission,
      refreshNotifications,
      requestBrowserPermission,
      markAsRead,
      markAllAsRead
    }),
    [
      notifications,
      stats,
      unreadCount,
      isLoading,
      errorMessage,
      browserPermission,
      refreshNotifications,
      requestBrowserPermission,
      markAsRead,
      markAllAsRead
    ]
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}
