/**
 * habitsApi.js — HABIT CRUD OPERATIONS (Supabase)
 *
 * All database operations for habits and habit logs.
 * Habits are recurring activities (daily, weekly, monthly, custom).
 * Habit logs track daily completion status.
 *
 * Functions:
 *   listHabitsByUser, createHabit, updateHabit, deleteHabit
 *   listHabitLogs, listHabitLogsByHabitIds, upsertHabitLog
 */

import { supabase } from "./supabase/client";
import {
  isValidIsoDate,
  validateHabitPayload
} from "../utils/validation";

function getClientOrThrow() {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  return supabase;
}

export async function listHabitsByUser(userId) {
  const client = getClientOrThrow();

  if (!userId) {
    return {
      data: [],
      error: null
    };
  }

  return client
    .from("habits")
    .select("id, user_id, title, frequency, is_active, created_at, updated_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
}

export async function createHabit(habitInput) {
  const client = getClientOrThrow();

  if (!habitInput?.user_id) {
    return {
      data: null,
      error: new Error("Habit user_id is required.")
    };
  }

  const { isValid, errors, normalized } = validateHabitPayload(habitInput, {
    partial: false
  });

  if (!isValid) {
    return {
      data: null,
      error: new Error(errors.join(" "))
    };
  }

  return client
    .from("habits")
    .insert(normalized)
    .select("id, user_id, title, frequency, is_active, created_at, updated_at")
    .single();
}

export async function updateHabit(habitId, updates) {
  const client = getClientOrThrow();

  if (!habitId) {
    return {
      data: null,
      error: new Error("Habit ID is required.")
    };
  }

  const { isValid, errors, normalized } = validateHabitPayload(updates, {
    partial: true
  });

  if (!isValid) {
    return {
      data: null,
      error: new Error(errors.join(" "))
    };
  }

  if (Object.keys(normalized).length === 0) {
    return {
      data: null,
      error: new Error("No habit fields were provided for update.")
    };
  }

  return client
    .from("habits")
    .update(normalized)
    .eq("id", habitId)
    .select("id, user_id, title, frequency, is_active, created_at, updated_at")
    .single();
}

export async function deleteHabit(habitId) {
  const client = getClientOrThrow();

  if (!habitId) {
    return {
      data: null,
      error: new Error("Habit ID is required.")
    };
  }

  return client.from("habits").delete().eq("id", habitId);
}

export async function listHabitLogs(habitId) {
  const client = getClientOrThrow();

  if (!habitId) {
    return {
      data: [],
      error: null
    };
  }

  return client
    .from("habit_logs")
    .select("id, habit_id, log_date, completed")
    .eq("habit_id", habitId)
    .order("log_date", { ascending: false });
}

export async function listHabitLogsByHabitIds(habitIds) {
  const client = getClientOrThrow();

  const sanitizedHabitIds = [...new Set((habitIds ?? []).filter(Boolean))];

  if (!sanitizedHabitIds.length) {
    return {
      data: [],
      error: null
    };
  }

  return client
    .from("habit_logs")
    .select("id, habit_id, log_date, completed")
    .in("habit_id", sanitizedHabitIds)
    .order("log_date", { ascending: false });
}

export async function upsertHabitLog({ habitId, logDate, completed }) {
  const client = getClientOrThrow();

  if (!habitId) {
    return {
      data: null,
      error: new Error("Habit ID is required.")
    };
  }

  if (!isValidIsoDate(logDate)) {
    return {
      data: null,
      error: new Error("Habit log date must be a valid ISO date (YYYY-MM-DD).")
    };
  }

  return client
    .from("habit_logs")
    .upsert(
      {
        habit_id: habitId,
        log_date: logDate,
        completed: Boolean(completed)
      },
      { onConflict: "habit_id,log_date" }
    )
    .select("id, habit_id, log_date, completed")
    .single();
}
