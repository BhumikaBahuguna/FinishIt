import { createOrUpdateTaskCalendarEvent } from "./googleCalendarApi";
import { upsertTaskCalendarSyncEntry } from "./calendarSyncApi";

function getReminderMinutesByUrgency(urgency) {
  const value = Number(urgency ?? 3);

  if (value >= 5) return [1440, 60, 10];
  if (value >= 4) return [1440, 60];
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
    const reminderMinutes = getReminderMinutesByUrgency(task.urgency);

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
    await upsertTaskCalendarSyncEntry({
      userId,
      taskId: task.id,
      externalEventId: existingSyncEntry?.external_event_id ?? null,
      syncStatus: "failed",
      errorMessage: error.message,
      reminderMinutes: getReminderMinutesByUrgency(task.urgency)
    });

    return {
      data: null,
      error,
      skipped: false
    };
  }
}
