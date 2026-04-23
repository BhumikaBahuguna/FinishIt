/**
 * calendarTaskSyncService.js — CALENDAR SYNC ORCHESTRATOR
 *
 * Coordinates between the Google Calendar API and the local Supabase
 * task_calendar_sync table to keep event IDs tracking aligned.
 */

import { createOrUpdateTaskCalendarEvent } from "./googleCalendarApi";
import { upsertTaskCalendarSyncEntry } from "./calendarSyncApi";
import { isTaskUrgent } from "./taskPrioritization";

function getReminderMinutes(urgent) {
  if (urgent) return [1440, 60, 10];
  return [1440];
}

export async function syncTaskDeadlineToCalendar({ userId, task, existingSyncEntry }) {
  if (!task.deadline) {
    return {
      data: null,
      error: new Error("Task does not have a deadline."),
      skipped: true
    };
  }

  try {
    const event = await createOrUpdateTaskCalendarEvent(task, existingSyncEntry?.external_event_id);
    const urgent = isTaskUrgent(task);
    const reminderMinutes = getReminderMinutes(urgent);

    const syncResult = await upsertTaskCalendarSyncEntry({
      userId,
      taskId: task.id,
      externalEventId: event.id,
      syncStatus: "synced",
      errorMessage: null,
      reminderMinutes
    });

    if (syncResult.error) {
      throw new Error(syncResult.error.message);
    }

    return {
      data: syncResult.data,
      error: null,
      skipped: false
    };
  } catch (error) {
    const urgent = isTaskUrgent(task);

    await upsertTaskCalendarSyncEntry({
      userId,
      taskId: task.id,
      externalEventId: existingSyncEntry?.external_event_id ?? null,
      syncStatus: "failed",
      errorMessage: error.message,
      reminderMinutes: getReminderMinutes(urgent)
    });

    return {
      data: null,
      error,
      skipped: false
    };
  }
}
