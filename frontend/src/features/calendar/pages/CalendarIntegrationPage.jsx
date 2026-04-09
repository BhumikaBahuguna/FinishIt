/**
 * CalendarIntegrationPage.jsx — CALENDAR PAGE (/calendar)
 *
 * Allows users to connect their Google Calendar and manually sync task
 * deadlines as Google Calendar events with pop-up reminders.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../../auth/hooks/useAuth";
import { listTasksByUser } from "../../tasks/services/tasksApi";
import { Card } from "../../../shared/components/ui/Card";
import { PageHeader } from "../../../shared/components/ui/PageHeader";
import { CalendarSyncTable } from "../components/CalendarSyncTable";
import { listTaskCalendarSyncByUser } from "../services/calendarSyncApi";
import {
  connectGoogleCalendar,
  hasGoogleCalendarSession,
  isGoogleCalendarConfigured
} from "../services/googleCalendarApi";
import { syncTaskDeadlineToCalendar } from "../services/calendarTaskSyncService";

const SYNCABLE_TASK_STATUSES = new Set(["pending", "in_progress"]);

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

  const syncByTaskId = useMemo(() => {
    return new Map(syncEntries.map((entry) => [entry.task_id, entry]));
  }, [syncEntries]);

  const syncableTasks = useMemo(
    () =>
      tasks.filter((task) => task.deadline && SYNCABLE_TASK_STATUSES.has(task.status)),
    [tasks]
  );

  const loadCalendarData = useCallback(async () => {
    if (!user?.id) {
      setTasks([]);
      setSyncEntries([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    try {
      const [tasksResult, syncResult] = await Promise.all([
        listTasksByUser(user.id),
        listTaskCalendarSyncByUser(user.id)
      ]);

      if (tasksResult.error) {
        setErrorMessage(tasksResult.error.message);
        return;
      }

      if (syncResult.error) {
        setErrorMessage(syncResult.error.message);
        return;
      }

      setTasks(tasksResult.data ?? []);
      setSyncEntries(syncResult.data ?? []);
    } catch (error) {
      setErrorMessage(error.message || "Unable to load calendar synchronization data.");
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadCalendarData();
  }, [loadCalendarData]);

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
    if (!isGoogleConnected) {
      setErrorMessage("Connect Google Calendar before syncing tasks.");
      return;
    }

    setErrorMessage("");
    setStatusMessage("");
    setIsSyncingTaskId(task.id);

    const existingSyncEntry = syncByTaskId.get(task.id);

    try {
      const result = await syncTaskDeadlineToCalendar({
        userId: user.id,
        task,
        existingSyncEntry
      });

      if (result.error && !result.skipped) {
        setErrorMessage(result.error.message || "Task sync failed.");
      } else if (result.skipped) {
        setStatusMessage("Task without deadline was skipped.");
      } else {
        setStatusMessage(`Task synced: ${task.title}`);
      }
    } catch (error) {
      setErrorMessage(error.message || "Task sync failed.");
    }

    setIsSyncingTaskId(null);
    await loadCalendarData();
  }

  async function handleSyncAll() {
    if (!user?.id) return;
    if (!isGoogleConnected) {
      setErrorMessage("Connect Google Calendar before syncing tasks.");
      return;
    }

    setIsSyncingAll(true);
    setErrorMessage("");
    setStatusMessage("");

    let syncedCount = 0;
    let failedCount = 0;

    const results = await Promise.allSettled(
      syncableTasks.map((task) =>
        syncTaskDeadlineToCalendar({
          userId: user.id,
          task,
          existingSyncEntry: syncByTaskId.get(task.id)
        })
      )
    );

    results.forEach((result) => {
      if (result.status === "rejected") {
        failedCount += 1;
        return;
      }

      if (result.value.error) {
        failedCount += 1;
      } else {
        syncedCount += 1;
      }
    });

    setStatusMessage(`Calendar sync complete. Synced ${syncedCount}, failed ${failedCount}.`);
    setIsSyncingAll(false);
    await loadCalendarData();
  }

  return (
    <div className="page-content">
      <PageHeader
        title="Calendar Integration"
        subtitle="Synchronize task deadlines to Google Calendar with reminders."
      />

      <Card title="Google Calendar Connection">
        <p className="data-list-meta">
          Configuration: {isGoogleCalendarConfigured() ? "Configured" : "Missing VITE_GOOGLE_CLIENT_ID"}
        </p>
        <p className="data-list-meta">Connection: {isGoogleConnected ? "Connected" : "Not connected"}</p>

        <div className="actions-row">
          <button type="button" className="btn btn-primary" onClick={handleConnectGoogle}>
            {isGoogleConnected ? "Reconnect Google Calendar" : "Connect Google Calendar"}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleSyncAll}
            disabled={!isGoogleConnected || isSyncingAll || syncableTasks.length === 0}
          >
            {isSyncingAll ? "Syncing Tasks..." : "Sync All Task Deadlines"}
          </button>
        </div>

        {statusMessage ? <p className="status-note">{statusMessage}</p> : null}
        {errorMessage ? <p className="status-error">{errorMessage}</p> : null}
      </Card>

      <Card title="Task Calendar Synchronization">
        {isLoading ? <p>Loading task sync status...</p> : null}
        {!isLoading && syncableTasks.length === 0 ? (
          <p>No syncable tasks found. Add task deadlines in Task Management first.</p>
        ) : null}

        {!isLoading && syncableTasks.length > 0 ? (
          <CalendarSyncTable
            tasks={syncableTasks}
            syncByTaskId={syncByTaskId}
            onSyncTask={handleSyncTask}
            isSyncingTaskId={isSyncingTaskId}
          />
        ) : null}
      </Card>
    </div>
  );
}
