/**
 * googleCalendarApi.js — GOOGLE CALENDAR INTEGRATION
 *
 * Handles the OAuth flow using Google Identity Services to get access tokens,
 * and calls the Google Calendar API to create, update, and delete events.
 * Tokens are kept in memory (no backend storage for Google credentials).
 */

const GOOGLE_IDENTITY_SCRIPT_URL = "https://accounts.google.com/gsi/client";
const CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar.events";

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

let identityScriptPromise = null;
let tokenClient = null;
let accessToken = null;
let tokenExpiryTimestamp = 0;

function hasValidToken() {
  return Boolean(accessToken) && Date.now() < tokenExpiryTimestamp;
}

function ensureIdentityScript() {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Google Identity Service requires a browser environment."));
  }

  if (window.google?.accounts?.oauth2) {
    return Promise.resolve();
  }

  if (identityScriptPromise) {
    return identityScriptPromise;
  }

  identityScriptPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector(`script[src="${GOOGLE_IDENTITY_SCRIPT_URL}"]`);

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener("error", () => reject(new Error("Failed to load Google Identity script.")), {
        once: true
      });
      return;
    }

    const script = document.createElement("script");
    script.src = GOOGLE_IDENTITY_SCRIPT_URL;
    script.async = true;
    script.defer = true;

    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google Identity script."));

    document.head.appendChild(script);
  });

  return identityScriptPromise;
}

function ensureGoogleConfig() {
  if (!googleClientId) {
    throw new Error("Google Calendar is not configured. Set VITE_GOOGLE_CLIENT_ID.");
  }
}

async function getTokenClient() {
  ensureGoogleConfig();
  await ensureIdentityScript();

  if (!tokenClient) {
    tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: googleClientId,
      scope: CALENDAR_SCOPE,
      callback: () => {}
    });
  }

  return tokenClient;
}

async function requestAccessToken(interactive = true) {
  if (hasValidToken()) {
    return accessToken;
  }

  const client = await getTokenClient();

  return new Promise((resolve, reject) => {
    client.callback = (response) => {
      if (response.error) {
        reject(new Error(response.error_description || response.error));
        return;
      }

      accessToken = response.access_token;
      const expiresInSeconds = Number(response.expires_in ?? 3600);
      tokenExpiryTimestamp = Date.now() + expiresInSeconds * 1000;
      resolve(accessToken);
    };

    client.requestAccessToken({
      prompt: interactive ? "consent" : ""
    });
  });
}

async function calendarRequest(endpoint, options = {}, interactive = false) {
  const token = await requestAccessToken(interactive);

  const response = await fetch(`https://www.googleapis.com/calendar/v3${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(options.headers ?? {})
    }
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = payload?.error?.message || "Google Calendar API request failed.";
    throw new Error(message);
  }

  return payload;
}

function buildReminderOverrides(task) {
  // Import would create a circular dep, so inline the 48-hour check
  const FORTY_EIGHT_HOURS_MS = 48 * 60 * 60 * 1000;
  let isUrgent = false;

  if (task.deadline) {
    const deadlineTimestamp = new Date(task.deadline).getTime();
    if (!Number.isNaN(deadlineTimestamp)) {
      isUrgent = deadlineTimestamp <= Date.now() + FORTY_EIGHT_HOURS_MS;
    }
  }

  if (isUrgent) {
    return [{ method: "popup", minutes: 1440 }, { method: "popup", minutes: 60 }, { method: "popup", minutes: 10 }];
  }

  return [{ method: "popup", minutes: 1440 }];
}

function buildTaskEventPayload(task) {
  if (!task.deadline) {
    throw new Error("Task must have a deadline to sync with Google Calendar.");
  }

  const start = new Date(task.deadline);

  if (Number.isNaN(start.getTime())) {
    throw new Error("Task deadline is invalid.");
  }

  const end = new Date(start.getTime() + 30 * 60 * 1000);

  return {
    summary: task.title,
    description: `${task.description ?? "No description"}\n\nFinishIt Task ID: ${task.id}`,
    start: {
      dateTime: start.toISOString()
    },
    end: {
      dateTime: end.toISOString()
    },
    reminders: {
      useDefault: false,
      overrides: buildReminderOverrides(task)
    }
  };
}

export function isGoogleCalendarConfigured() {
  return Boolean(googleClientId);
}

export function hasGoogleCalendarSession() {
  return hasValidToken();
}

export async function connectGoogleCalendar() {
  await requestAccessToken(true);
}

export async function createOrUpdateTaskCalendarEvent(task, existingEventId = null) {
  const eventPayload = buildTaskEventPayload(task);

  if (existingEventId) {
    return calendarRequest(
      `/calendars/primary/events/${existingEventId}`,
      {
        method: "PATCH",
        body: JSON.stringify(eventPayload)
      },
      true
    );
  }

  return calendarRequest(
    "/calendars/primary/events",
    {
      method: "POST",
      body: JSON.stringify(eventPayload)
    },
    true
  );
}

export async function deleteTaskCalendarEvent(eventId) {
  if (!eventId) return;

  await calendarRequest(
    `/calendars/primary/events/${eventId}`,
    {
      method: "DELETE"
    },
    false
  );
}
