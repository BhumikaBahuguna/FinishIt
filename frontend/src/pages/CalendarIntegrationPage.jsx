/**
 * CalendarIntegrationPage.jsx — CALENDAR PAGE (/calendar)
 *
 * Redesigned premium calendar integration page with:
 *   - Monthly calendar grid showing tasks on their deadline dates
 *   - Google Calendar connection card with status indicator
 *   - Task sync list with sync status badges and actions
 *   - Month navigation and today indicator
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { listTasksByUser } from "../services/tasksApi";
import { listTaskCalendarSyncByUser } from "../services/calendarSyncApi";
import {
  connectGoogleCalendar,
  hasGoogleCalendarSession,
  isGoogleCalendarConfigured
} from "../services/googleCalendarApi";
import { syncTaskDeadlineToCalendar } from "../services/calendarTaskSyncService";

const SYNCABLE_TASK_STATUSES = new Set(["pending", "in_progress"]);
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const STATUS_COLORS = {
  pending: "#ffea00",
  in_progress: "#00e5ff",
  completed: "#00e676",
  archived: "#5d7ea6"
};

const SYNC_BADGES = {
  synced: { label: "Synced", cls: "cal-sync-badge--green" },
  pending: { label: "Pending", cls: "cal-sync-badge--yellow" },
  failed: { label: "Failed", cls: "cal-sync-badge--red" }
};

/** Build calendar grid for a given month */
function buildCalendarDays(year, month) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startPad = firstDay.getDay();
  const totalDays = lastDay.getDate();

  const days = [];
  // Padding from previous month
  const prevMonthLast = new Date(year, month, 0).getDate();
  for (let i = startPad - 1; i >= 0; i--) {
    days.push({ day: prevMonthLast - i, isCurrentMonth: false, date: null });
  }
  // Current month days
  for (let d = 1; d <= totalDays; d++) {
    const iso = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    days.push({ day: d, isCurrentMonth: true, date: iso });
  }
  // Padding for next month
  const remaining = 42 - days.length;
  for (let d = 1; d <= remaining; d++) {
    days.push({ day: d, isCurrentMonth: false, date: null });
  }
  return days;
}

export function CalendarIntegrationPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [syncEntries, setSyncEntries] = useState([]);
  const [isGoogleConnected, setIsGoogleConnected] = useState(hasGoogleCalendarSession());
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [isSyncingTaskId, setIsSyncingTaskId] = useState(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Calendar navigation
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(null);

  const todayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const syncByTaskId = useMemo(() => {
    return new Map(syncEntries.map((entry) => [entry.task_id, entry]));
  }, [syncEntries]);

  const syncableTasks = useMemo(
    () => tasks.filter((task) => task.deadline && SYNCABLE_TASK_STATUSES.has(task.status)),
    [tasks]
  );

  // Group tasks by deadline date
  const tasksByDate = useMemo(() => {
    const map = {};
    tasks.forEach((t) => {
      if (!t.deadline) return;
      const d = t.deadline.slice(0, 10);
      if (!map[d]) map[d] = [];
      map[d].push(t);
    });
    return map;
  }, [tasks]);

  const calendarDays = useMemo(() => buildCalendarDays(viewYear, viewMonth), [viewYear, viewMonth]);

  // Tasks for the selected date
  const selectedDateTasks = selectedDate ? (tasksByDate[selectedDate] || []) : [];

  const loadCalendarData = useCallback(async () => {
    if (!user?.id) { setTasks([]); setSyncEntries([]); setIsLoading(false); return; }
    setIsLoading(true);
    setErrorMessage("");
    try {
      const [tasksResult, syncResult] = await Promise.all([
        listTasksByUser(user.id),
        listTaskCalendarSyncByUser(user.id)
      ]);
      if (tasksResult.error) { setErrorMessage(tasksResult.error.message); return; }
      if (syncResult.error) { setErrorMessage(syncResult.error.message); return; }
      setTasks(tasksResult.data ?? []);
      setSyncEntries(syncResult.data ?? []);
    } catch (error) {
      setErrorMessage(error.message || "Unable to load calendar data.");
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { loadCalendarData(); }, [loadCalendarData]);

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(viewYear - 1); setViewMonth(11); }
    else setViewMonth(viewMonth - 1);
  }

  function nextMonth() {
    if (viewMonth === 11) { setViewYear(viewYear + 1); setViewMonth(0); }
    else setViewMonth(viewMonth + 1);
  }

  function goToToday() {
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    setSelectedDate(todayIso);
  }

  async function handleConnectGoogle() {
    if (!isGoogleCalendarConfigured()) {
      setErrorMessage("Google Calendar is not configured. Set VITE_GOOGLE_CLIENT_ID.");
      return;
    }
    try {
      await connectGoogleCalendar();
      setIsGoogleConnected(true);
      setErrorMessage("");
      setStatusMessage("Google Calendar connected successfully.");
    } catch (error) {
      setErrorMessage(error.message || "Unable to connect Google Calendar.");
    }
  }

  async function handleSyncTask(task) {
    if (!user?.id) return;
    if (!isGoogleConnected) { setErrorMessage("Connect Google Calendar first."); return; }
    setErrorMessage(""); setStatusMessage(""); setIsSyncingTaskId(task.id);
    try {
      const result = await syncTaskDeadlineToCalendar({
        userId: user.id, task, existingSyncEntry: syncByTaskId.get(task.id)
      });
      if (result.error && !result.skipped) setErrorMessage(result.error.message || "Sync failed.");
      else if (result.skipped) setStatusMessage("Task without deadline was skipped.");
      else setStatusMessage(`Synced: ${task.title}`);
    } catch (error) { setErrorMessage(error.message || "Sync failed."); }
    setIsSyncingTaskId(null);
    await loadCalendarData();
  }

  async function handleSyncAll() {
    if (!user?.id || !isGoogleConnected) return;
    setIsSyncingAll(true); setErrorMessage(""); setStatusMessage("");
    let synced = 0, failed = 0;
    const results = await Promise.allSettled(
      syncableTasks.map((task) =>
        syncTaskDeadlineToCalendar({ userId: user.id, task, existingSyncEntry: syncByTaskId.get(task.id) })
      )
    );
    results.forEach((r) => { if (r.status === "rejected" || r.value?.error) failed++; else synced++; });
    setStatusMessage(`Sync complete. ${synced} synced, ${failed} failed.`);
    setIsSyncingAll(false);
    await loadCalendarData();
  }

  return (
    <div className="cal-page">
      {/* Header */}
      <header className="cal-page__header">
        <div>
          <h1 className="cal-page__title">Calendar Integration</h1>
          <p className="cal-page__subtitle">Visualize deadlines and sync tasks to Google Calendar</p>
        </div>
      </header>

      {/* Top row: Google connection + KPI stats */}
      <div className="cal-top-row">
        <div className="cal-connect-card">
          <div className="cal-connect-card__left">
            <span className="cal-connect-card__icon">📅</span>
            <div>
              <h3 className="cal-connect-card__title">Google Calendar</h3>
              <p className="cal-connect-card__status">
                <span className={`cal-connect-dot ${isGoogleConnected ? "cal-connect-dot--on" : ""}`} />
                {isGoogleConnected ? "Connected" : "Not connected"}
              </p>
            </div>
          </div>
          <button className="cal-connect-card__btn" onClick={handleConnectGoogle}>
            {isGoogleConnected ? "Reconnect" : "Connect"}
          </button>
        </div>

        <div className="cal-stat-card">
          <p className="cal-stat-card__value">{syncableTasks.length}</p>
          <p className="cal-stat-card__label">Syncable Tasks</p>
        </div>
        <div className="cal-stat-card">
          <p className="cal-stat-card__value">{syncEntries.filter((e) => e.sync_status === "synced").length}</p>
          <p className="cal-stat-card__label">Already Synced</p>
        </div>
        <div className="cal-stat-card">
          <p className="cal-stat-card__value">{Object.keys(tasksByDate).length}</p>
          <p className="cal-stat-card__label">Days with Tasks</p>
        </div>
      </div>

      {statusMessage && <p className="cal-status-msg cal-status-msg--success">✓ {statusMessage}</p>}
      {errorMessage && <p className="cal-status-msg cal-status-msg--error">⚠ {errorMessage}</p>}

      {isLoading ? (
        <div className="dashboard-loading"><div className="dashboard-loading__spinner" /><p>Loading calendar...</p></div>
      ) : (
        <div className="cal-main-layout">
          {/* Calendar Grid */}
          <div className="cal-grid-card">
            <div className="cal-grid-nav">
              <button className="cal-grid-nav__btn" onClick={prevMonth}>‹</button>
              <h2 className="cal-grid-nav__title">{MONTH_NAMES[viewMonth]} {viewYear}</h2>
              <button className="cal-grid-nav__btn" onClick={nextMonth}>›</button>
              <button className="cal-grid-nav__today" onClick={goToToday}>Today</button>
            </div>

            <div className="cal-grid-weekdays">
              {WEEKDAYS.map((d) => <span key={d} className="cal-grid-weekday">{d}</span>)}
            </div>

            <div className="cal-grid">
              {calendarDays.map((cell, i) => {
                const hasTasks = cell.date && tasksByDate[cell.date];
                const isToday = cell.date === todayIso;
                const isSelected = cell.date === selectedDate;
                const taskCount = hasTasks ? tasksByDate[cell.date].length : 0;

                return (
                  <button
                    key={i}
                    className={[
                      "cal-grid-cell",
                      !cell.isCurrentMonth && "cal-grid-cell--dim",
                      isToday && "cal-grid-cell--today",
                      isSelected && "cal-grid-cell--selected",
                      hasTasks && "cal-grid-cell--has-tasks"
                    ].filter(Boolean).join(" ")}
                    onClick={() => cell.date && setSelectedDate(cell.date)}
                    disabled={!cell.isCurrentMonth}
                  >
                    <span className="cal-grid-cell__day">{cell.day}</span>
                    {taskCount > 0 && (
                      <span className="cal-grid-cell__dots">
                        {Array.from({ length: Math.min(taskCount, 3) }).map((_, j) => (
                          <span key={j} className="cal-grid-cell__dot" />
                        ))}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Selected date tasks + Sync list */}
          <div className="cal-sidebar">
            {/* Selected date panel */}
            <div className="cal-date-panel">
              <h3 className="cal-date-panel__title">
                {selectedDate
                  ? new Date(selectedDate + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })
                  : "Select a date"}
              </h3>

              {selectedDate && selectedDateTasks.length === 0 && (
                <p className="cal-date-panel__empty">No tasks on this date</p>
              )}

              {selectedDateTasks.map((task) => (
                <div key={task.id} className="cal-date-task">
                  <span className="cal-date-task__dot" style={{ background: STATUS_COLORS[task.status] }} />
                  <div className="cal-date-task__info">
                    <p className="cal-date-task__name">{task.title}</p>
                    <p className="cal-date-task__time">
                      {new Date(task.deadline).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                      {" · "}
                      <span style={{ color: STATUS_COLORS[task.status] }}>{task.status.replace("_", " ")}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Sync actions */}
            <div className="cal-sync-panel">
              <div className="cal-sync-panel__header">
                <h3 className="cal-sync-panel__title">Sync Queue</h3>
                <button
                  className="cal-sync-panel__btn"
                  onClick={handleSyncAll}
                  disabled={!isGoogleConnected || isSyncingAll || syncableTasks.length === 0}
                >
                  {isSyncingAll ? "Syncing..." : "Sync All"}
                </button>
              </div>

              {syncableTasks.length === 0 && (
                <p className="cal-date-panel__empty">No tasks to sync. Add deadlines first.</p>
              )}

              <div className="cal-sync-list">
                {syncableTasks.map((task) => {
                  const syncEntry = syncByTaskId.get(task.id);
                  const badge = SYNC_BADGES[syncEntry?.sync_status] || SYNC_BADGES.pending;

                  return (
                    <div key={task.id} className="cal-sync-item">
                      <div className="cal-sync-item__info">
                        <p className="cal-sync-item__name">{task.title}</p>
                        <p className="cal-sync-item__date">
                          {new Date(task.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </p>
                      </div>
                      <span className={`cal-sync-badge ${badge.cls}`}>{badge.label}</span>
                      <button
                        className="cal-sync-item__btn"
                        onClick={() => handleSyncTask(task)}
                        disabled={isSyncingTaskId === task.id}
                      >
                        {isSyncingTaskId === task.id ? "..." : "⟳"}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
