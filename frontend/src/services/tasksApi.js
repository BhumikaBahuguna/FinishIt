/**
 * tasksApi.js — TASK CRUD OPERATIONS (Supabase)
 *
 * All database operations for tasks: list, create, update, delete.
 * Each operation validates input, normalizes data, and records history.
 *
 * Data flow: Page component → tasksApi → Supabase PostgreSQL → response
 *
 * Functions:
 *   listTasksByUser(userId) — fetch all tasks for a user
 *   createTask(input) — validate, insert, and record history
 *   updateTask(id, updates) — validate, update, and record history
 *   deleteTask(id) — remove a task (cascades to history)
 */

import { supabase } from "./supabase/client";
import { validateTaskPayload } from "../utils/validation";

function getClientOrThrow() {
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  return supabase;
}

function normalizeTaskPayload(taskInput) {
  const { isValid, errors, normalized } = validateTaskPayload(taskInput, {
    partial: true
  });

  if (!isValid) {
    throw new Error(errors.join(" "));
  }

  const payload = { ...normalized };

  if (Object.hasOwn(payload, "urgency")) {
    payload.urgency = Boolean(payload.urgency);
  }

  if (Object.hasOwn(payload, "importance")) {
    payload.importance = Boolean(payload.importance);
  }

  if (Object.hasOwn(payload, "deadline") && !payload.deadline) {
    payload.deadline = null;
  }

  if (Object.hasOwn(payload, "status")) {
    if (payload.status === "completed") {
      payload.completed_at = payload.completed_at ?? new Date().toISOString();
    } else {
      payload.completed_at = null;
    }
  }

  return payload;
}

async function recordTaskHistory({ taskId, status, changedByUserId }) {
  const client = getClientOrThrow();

  try {
    return await client.from("task_history").insert({
      task_id: taskId,
      status,
      changed_by_user_id: changedByUserId ?? null
    });
  } catch (error) {
    // Keep task operations resilient if history write fails.
    console.error("Task history write failed", error);
    return {
      data: null,
      error
    };
  }
}

export async function listTasksByUser(userId) {
  const client = getClientOrThrow();

  if (!userId) {
    return {
      data: [],
      error: null
    };
  }

  return client
    .from("tasks")
    .select("id, user_id, title, description, deadline, urgency, importance, status, completed_at, created_at, updated_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
}

export async function createTask(taskInput) {
  const client = getClientOrThrow();
  const payload = normalizeTaskPayload(taskInput);

  if (!payload.user_id) {
    return {
      data: null,
      error: new Error("Task user_id is required.")
    };
  }

  const { isValid, errors } = validateTaskPayload(payload, {
    partial: false
  });

  if (!isValid) {
    return {
      data: null,
      error: new Error(errors.join(" "))
    };
  }

  const result = await client
    .from("tasks")
    .insert(payload)
    .select("id, user_id, title, description, deadline, urgency, importance, status, completed_at, created_at, updated_at")
    .single();

  if (result.data?.id && !result.error) {
    await recordTaskHistory({
      taskId: result.data.id,
      status: result.data.status,
      changedByUserId: result.data.user_id
    });
  }

  return result;
}

export async function updateTask(taskId, updates, options = {}) {
  const client = getClientOrThrow();

  if (!taskId) {
    return {
      data: null,
      error: new Error("Task ID is required.")
    };
  }

  const payload = normalizeTaskPayload(updates);

  if (Object.keys(payload).length === 0) {
    return {
      data: null,
      error: new Error("No task fields were provided for update.")
    };
  }

  const result = await client
    .from("tasks")
    .update(payload)
    .eq("id", taskId)
    .select("id, user_id, title, description, deadline, urgency, importance, status, completed_at, created_at, updated_at")
    .single();

  if (result.data?.id && !result.error) {
    await recordTaskHistory({
      taskId: result.data.id,
      status: result.data.status,
      changedByUserId: options.changedByUserId ?? null
    });
  }

  return result;
}

export async function deleteTask(taskId) {
  const client = getClientOrThrow();

  if (!taskId) {
    return {
      data: null,
      error: new Error("Task ID is required.")
    };
  }

  return client.from("tasks").delete().eq("id", taskId);
}
