/**
 * aiAssistantApi.js — AI ASSISTANT SERVICE
 *
 * Gathers all user data (tasks, habits, analytics) and sends it to
 * Groq API for intelligent analysis. Provides:
 *   - Task planning suggestions
 *   - Weekly progress summaries
 *   - Habit performance insights
 *   - Free-form Q&A about productivity data
 *
 * Uses Groq's lightning-fast Llama 3 model (free tier).
 * API key is stored in VITE_GROQ_API_KEY environment variable.
 */

import { listTasksByUser } from "./tasksApi";
import { listHabitsByUser, listHabitLogsByHabitIds } from "./habitsApi";
import { buildHabitProgressByHabit, getTodayIsoDate } from "./habitStreaks";
import {
  buildEisenhowerMatrix,
  getOverdueTasks,
  prioritizeTasks,
} from "./taskPrioritization";

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_MODEL = "llama-3.3-70b-versatile";
const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";

/**
 * Gather a comprehensive data context about the user's tasks and habits
 * to send alongside prompts to the AI.
 */
export async function gatherUserContext(userId) {
  if (!userId) {
    return { context: null, error: new Error("User ID is required.") };
  }

  const [tasksResult, habitsResult] = await Promise.all([
    listTasksByUser(userId),
    listHabitsByUser(userId),
  ]);

  if (tasksResult.error) return { context: null, error: tasksResult.error };
  if (habitsResult.error) return { context: null, error: habitsResult.error };

  const tasks = tasksResult.data ?? [];
  const habits = habitsResult.data ?? [];
  const habitIds = habits.map((h) => h.id);

  const logsResult = await listHabitLogsByHabitIds(habitIds);
  if (logsResult.error) return { context: null, error: logsResult.error };

  const habitLogs = logsResult.data ?? [];
  const prioritized = prioritizeTasks(tasks);
  const matrix = buildEisenhowerMatrix(prioritized);
  const overdueTasks = getOverdueTasks(tasks);
  const habitProgressById = buildHabitProgressByHabit(habits, habitLogs);

  const today = getTodayIsoDate();

  // Build habit summaries
  const habitSummaries = habits.map((h) => {
    const progress = habitProgressById.get(h.id);
    return {
      title: h.title,
      frequency: h.frequency,
      isActive: h.is_active,
      currentStreak: progress?.currentStreak ?? 0,
      bestStreak: progress?.bestStreak ?? 0,
      completedToday: progress?.completedToday ?? false,
    };
  });

  // Build task summaries
  const taskSummaries = tasks.map((t) => ({
    title: t.title,
    description: t.description || "",
    status: t.status,
    urgency: t.urgency,
    importance: t.importance,
    deadline: t.deadline || "no deadline",
    completedAt: t.completed_at || null,
    createdAt: t.created_at,
  }));

  // Calculate quick stats
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === "completed").length;
  const pendingTasks = tasks.filter(
    (t) => t.status === "pending" || t.status === "in_progress"
  ).length;
  const completionRate =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const totalHabits = habits.length;
  const completedHabitsToday = habitSummaries.filter(
    (h) => h.completedToday
  ).length;

  // Find most followed and most neglected habits
  const sortedByStreak = [...habitSummaries].sort(
    (a, b) => b.currentStreak - a.currentStreak
  );
  const mostFollowed = sortedByStreak[0] || null;
  const mostNeglected = sortedByStreak[sortedByStreak.length - 1] || null;

  // Recent completions (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const recentCompletions = tasks.filter((t) => {
    if (!t.completed_at) return false;
    return new Date(t.completed_at) >= sevenDaysAgo;
  });

  const context = {
    today,
    stats: {
      totalTasks,
      completedTasks,
      pendingTasks,
      overdueTasks: overdueTasks.length,
      completionRate,
      totalHabits,
      completedHabitsToday,
    },
    eisenhowerMatrix: {
      urgentImportant: matrix.urgent_important.map((t) => t.title),
      importantNotUrgent: matrix.important_not_urgent.map((t) => t.title),
      urgentNotImportant: matrix.urgent_not_important.map((t) => t.title),
      notUrgentNotImportant: matrix.not_urgent_not_important.map(
        (t) => t.title
      ),
    },
    overdueTasks: overdueTasks.map((t) => ({
      title: t.title,
      deadline: t.deadline,
    })),
    tasks: taskSummaries,
    habits: habitSummaries,
    mostFollowedHabit: mostFollowed,
    mostNeglectedHabit: mostNeglected,
    recentCompletions: recentCompletions.map((t) => ({
      title: t.title,
      completedAt: t.completed_at,
    })),
  };

  return { context, error: null };
}

/**
 * Build the system prompt that gives the AI context about the user's data.
 */
function buildSystemPrompt(context) {
  return `You are "FinishIt AI", a premium productivity assistant embedded in the FinishIt task & habit management app. You have access to the user's complete productivity data as of ${context.today}.

USER DATA SUMMARY:
- Total Tasks: ${context.stats.totalTasks} (${context.stats.completedTasks} completed, ${context.stats.pendingTasks} active, ${context.stats.overdueTasks} overdue)
- Task Completion Rate: ${context.stats.completionRate}%
- Total Habits: ${context.stats.totalHabits} (${context.stats.completedHabitsToday} completed today)

EISENHOWER MATRIX:
- 🔴 Urgent & Important (Do First): ${context.eisenhowerMatrix.urgentImportant.join(", ") || "None"}
- 🟡 Important, Not Urgent (Schedule): ${context.eisenhowerMatrix.importantNotUrgent.join(", ") || "None"}
- 🔵 Urgent, Not Important (Delegate): ${context.eisenhowerMatrix.urgentNotImportant.join(", ") || "None"}
- ⚪ Neither (Eliminate): ${context.eisenhowerMatrix.notUrgentNotImportant.join(", ") || "None"}

OVERDUE TASKS:
${context.overdueTasks.length > 0 ? context.overdueTasks.map((t) => `- "${t.title}" (deadline: ${t.deadline})`).join("\n") : "None"}

ALL TASKS:
${context.tasks.map((t) => `- "${t.title}" [${t.status}] urgency:${t.urgency} importance:${t.importance} deadline:${t.deadline}`).join("\n") || "No tasks yet."}

HABITS:
${context.habits.map((h) => `- "${h.title}" (${h.frequency}) — streak: ${h.currentStreak}d, best: ${h.bestStreak}d, today: ${h.completedToday ? "✅" : "❌"}`).join("\n") || "No habits yet."}

MOST FOLLOWED HABIT: ${context.mostFollowedHabit ? `"${context.mostFollowedHabit.title}" (${context.mostFollowedHabit.currentStreak}-day streak)` : "N/A"}
MOST NEGLECTED HABIT: ${context.mostNeglectedHabit ? `"${context.mostNeglectedHabit.title}" (${context.mostNeglectedHabit.currentStreak}-day streak)` : "N/A"}

RECENT COMPLETIONS (last 7 days):
${context.recentCompletions.map((t) => `- "${t.title}" completed ${t.completedAt}`).join("\n") || "None"}

GUIDELINES:
- Be concise, actionable, and specific. Reference task/habit names directly.
- Use emojis sparingly for visual clarity.
- When planning tasks, consider the Eisenhower Matrix and deadlines.
- For weekly summaries, highlight wins, areas of concern, and specific next steps.
- For habit analysis, compare streaks and consistency across all habits.
- Format responses with clear sections and bullet points when appropriate.
- Keep the tone professional, encouraging, but no-nonsense.`;
}

/**
 * Send a message to Groq API and get a response.
 * Uses OpenAI-compatible chat completions format.
 */
export async function sendAIMessage(userMessage, context) {
  if (!GROQ_API_KEY) {
    return {
      response: null,
      error: new Error(
        "Groq API key is not configured. Add VITE_GROQ_API_KEY to your .env file."
      ),
    };
  }

  const systemPrompt = buildSystemPrompt(context);

  const body = {
    model: GROQ_MODEL,
    messages: [
      {
        role: "system",
        content: systemPrompt,
      },
      {
        role: "user",
        content: userMessage,
      },
    ],
    temperature: 0.7,
    max_tokens: 1024,
  };

  try {
    const response = await fetch(GROQ_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMsg =
        errorData?.error?.message || `API error: ${response.status}`;
      return { response: null, error: new Error(errorMsg) };
    }

    const data = await response.json();
    const text =
      data?.choices?.[0]?.message?.content ??
      "I couldn't generate a response. Please try again.";

    return { response: text, error: null };
  } catch (err) {
    return {
      response: null,
      error: new Error(`Network error: ${err.message}`),
    };
  }
}

/**
 * Quick action prompts for the AI assistant.
 */
export const QUICK_ACTIONS = [
  {
    id: "plan-tasks",
    icon: "🗺️",
    label: "Plan My Tasks",
    prompt:
      "Analyze all my current tasks and create an efficient plan to complete them. Consider deadlines, the Eisenhower Matrix priorities, and suggest the optimal order to tackle them today and this week. Be very specific with task names.",
  },
  {
    id: "weekly-summary",
    icon: "📊",
    label: "Weekly Summary",
    prompt:
      "Give me a comprehensive weekly progress summary. Include: tasks completed this week, overdue tasks, habit consistency analysis, productivity trends, and specific actionable recommendations for next week.",
  },
  {
    id: "habit-analysis",
    icon: "🔍",
    label: "Habit Analysis",
    prompt:
      "Analyze all my habits in detail. Which habit am I most consistent with? Which one am I neglecting the most? How are my streaks trending? Give me specific strategies to improve my weakest habits while maintaining my strongest ones.",
  },
  {
    id: "focus-today",
    icon: "🎯",
    label: "What to Focus On",
    prompt:
      "Based on my current tasks, deadlines, and overdue items, what should I focus on TODAY? Give me a prioritized list of the top 3-5 things to accomplish, with brief reasoning for each.",
  },
  {
    id: "productivity-tips",
    icon: "💡",
    label: "Productivity Tips",
    prompt:
      "Based on my task completion patterns, habit streaks, and overdue items, give me 3-5 personalized productivity tips. Reference specific data points from my usage patterns.",
  },
  {
    id: "overdue-recovery",
    icon: "⚠️",
    label: "Overdue Recovery",
    prompt:
      "I have overdue tasks. Help me create a recovery plan. Which overdue tasks should I prioritize? Should any be rescheduled or broken into smaller steps? Give me a realistic plan to get back on track.",
  },
];
