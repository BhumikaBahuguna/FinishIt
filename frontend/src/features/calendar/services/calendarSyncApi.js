/**
 * calendarSyncApi.js — SUPABASE CALENDAR SYNC DB OPERATIONS
 *
 * Interacts with the task_calendar_sync table to track which tasks have been
 * pushed to Google Calendar, storing the external event IDs.
 */

import { supabase } from "../../../services/supabase/client";

function getClientOrThrow() {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  return supabase;
}

export async function listTaskCalendarSyncByUser(userId) {
  const client = getClientOrThrow();

  return client
    .from("task_calendar_sync")
    .select(
      "id, task_id, user_id, external_event_id, sync_status, error_message, reminder_minutes, last_synced_at, updated_at"
    )
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });
}

export async function upsertTaskCalendarSyncEntry({
  userId,
  taskId,
  externalEventId,
  syncStatus,
  errorMessage,
  reminderMinutes
}) {
  const client = getClientOrThrow();

  return client
    .from("task_calendar_sync")
    .upsert(
      {
        user_id: userId,
        task_id: taskId,
        external_event_id: externalEventId,
        sync_status: syncStatus,
        error_message: errorMessage,
        reminder_minutes: reminderMinutes,
        last_synced_at: new Date().toISOString()
      },
      { onConflict: "task_id" }
    )
    .select(
      "id, task_id, user_id, external_event_id, sync_status, error_message, reminder_minutes, last_synced_at, updated_at"
    )
    .single();
}

export async function deleteTaskCalendarSyncEntry(taskId) {
  const client = getClientOrThrow();

  return client.from("task_calendar_sync").delete().eq("task_id", taskId);
}
