/**
 * TaskManagementPage.jsx — TASK MANAGEMENT PAGE (/tasks)
 *
 * Redesigned premium task management interface with:
 *   - Left: Create/Edit task form (sticky sidebar)
 *   - Right: Overdue tasks grid + Upcoming/Active tasks grid
 *   - Each task card has edit, complete, flag, and delete actions
 *
 * Urgency is auto-computed from the deadline (≤48h = urgent).
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { createTask, deleteTask, listTasksByUser, updateTask } from "../services/tasksApi";
import {
  getOverdueTasks,
  isTaskUrgent,
  prioritizeTasks
} from "../services/taskPrioritization";
import { Button } from "../components/ui/Button";
import { validateTaskPayload } from "../utils/validation";

const DEFAULT_TASK_FORM = {
  title: "",
  description: "",
  deadline: "",
  importance: "no",
  status: "pending"
};

const STATUS_COLORS = {
  pending: "#ffea00",
  in_progress: "#00e5ff",
  completed: "#00e676",
  archived: "#5d7ea6"
};

const IMPORTANCE_OPTIONS = [
  { value: "no", label: "None", color: "transparent", border: "rgba(255,255,255,0.2)" },
  { value: "low", label: "Low", color: "#00e676", border: "#00e676" },
  { value: "medium", label: "Medium", color: "#ffea00", border: "#ffea00" },
  { value: "yes", label: "High", color: "#ff1744", border: "#ff1744" }
];

function toLocalDateTimeValue(isoString) {
  if (!isoString) return "";
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return "";
  const timezoneOffsetMilliseconds = date.getTimezoneOffset() * 60 * 1000;
  const localDate = new Date(date.getTime() - timezoneOffsetMilliseconds);
  return localDate.toISOString().slice(0, 16);
}

function toDatabaseDateTime(localDateTime) {
  if (!localDateTime) return null;
  const parsedDate = new Date(localDateTime);
  if (Number.isNaN(parsedDate.getTime())) return null;
  return parsedDate.toISOString();
}

/** Task Card component */
function TaskCard({ task, onEdit, onComplete, onDelete, isOverdue }) {
  const statusColor = STATUS_COLORS[task.status] || STATUS_COLORS.pending;
  const deadlineStr = task.deadline
    ? new Date(task.deadline).toLocaleString("en-US", {
        month: "short", day: "numeric", year: "numeric",
        hour: "numeric", minute: "2-digit"
      })
    : "No deadline";

  return (
    <div className={`task-card ${isOverdue ? "task-card--overdue" : "task-card--active"}`}>
      <div className="task-card__body">
        <h3 className="task-card__title">{task.title}</h3>
        <p className="task-card__deadline">
          {isOverdue ? "Due Date" : "Deadline"}: {deadlineStr}
        </p>
        <p className="task-card__status">
          Status:{" "}
          <span className="task-card__status-dot" style={{ background: statusColor }} />
          <span className={isOverdue ? "task-card__status-text--overdue" : ""}>
            {isOverdue
              ? `Overdue by ${task.overdueDays + 1} days`
              : task.status.replace("_", " ")}
          </span>
        </p>
      </div>

      <div className="task-card__actions">
        <button className="task-card__btn task-card__btn--edit" onClick={() => onEdit(task)} title="Edit">
          ✏️
        </button>
        {task.status !== "completed" && (
          <button className="task-card__btn task-card__btn--complete" onClick={() => onComplete(task.id)} title="Mark Completed">
            ✓
          </button>
        )}
        {task.status !== "completed" && (
          <span className="task-card__btn task-card__btn--mark-completed" onClick={() => onComplete(task.id)}>
            Mark Completed
          </span>
        )}
        <button className="task-card__btn task-card__btn--flag" title="Flag">
          🚩
        </button>
        <button className="task-card__btn task-card__btn--delete" onClick={() => onDelete(task.id)} title="Delete">
          🗑
        </button>
      </div>
    </div>
  );
}

export function TaskManagementPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [submitErrorMessage, setSubmitErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [taskForm, setTaskForm] = useState(DEFAULT_TASK_FORM);

  const overdueTasks = useMemo(() => getOverdueTasks(tasks), [tasks]);
  const activeTasks = useMemo(() => {
    const overdueIds = new Set(overdueTasks.map((t) => t.id));
    return tasks.filter(
      (t) => !overdueIds.has(t.id) && t.status !== "completed" && t.status !== "archived"
    );
  }, [tasks, overdueTasks]);

  const loadTasks = useCallback(async () => {
    if (!user?.id) {
      setTasks([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setErrorMessage("");
    try {
      const { data, error } = await listTasksByUser(user.id);
      if (error) { setErrorMessage(error.message); return; }
      setTasks(data ?? []);
    } catch (error) {
      setErrorMessage(error.message || "Unable to load tasks.");
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { loadTasks(); }, [loadTasks]);

  function handleTaskFormChange(event) {
    const { name, value } = event.target;
    setTaskForm((prev) => ({ ...prev, [name]: value }));
  }

  function beginTaskEdit(task) {
    setEditingTaskId(task.id);
    setTaskForm({
      title: task.title,
      description: task.description ?? "",
      deadline: toLocalDateTimeValue(task.deadline),
      importance: task.importance ? "yes" : "no",
      status: task.status
    });
    setSubmitErrorMessage("");
  }

  function resetTaskForm() {
    setEditingTaskId(null);
    setTaskForm(DEFAULT_TASK_FORM);
  }

  async function handleTaskSubmit(event) {
    event.preventDefault();
    if (!user?.id) return;
    setIsSubmitting(true);
    setSubmitErrorMessage("");

    const deadline = toDatabaseDateTime(taskForm.deadline);
    const urgency = deadline ? isTaskUrgent({ deadline }, new Date()) : false;
    const payload = {
      title: taskForm.title.trim(),
      description: taskForm.description.trim() || null,
      deadline,
      urgency,
      importance: taskForm.importance === "yes" || taskForm.importance === "medium",
      status: taskForm.status
    };

    const validation = validateTaskPayload(payload, { partial: false });
    if (!validation.isValid) {
      setIsSubmitting(false);
      setSubmitErrorMessage(validation.errors.join(" "));
      return;
    }

    try {
      if (editingTaskId) {
        const { error } = await updateTask(editingTaskId, payload, { changedByUserId: user.id });
        if (error) { setSubmitErrorMessage(error.message); return; }
      } else {
        const { error } = await createTask({ ...payload, user_id: user.id });
        if (error) { setSubmitErrorMessage(error.message); return; }
      }
      resetTaskForm();
      await loadTasks();
    } catch (error) {
      setSubmitErrorMessage(error.message || "Unable to save task.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleTaskDelete(taskId) {
    setSubmitErrorMessage("");
    try {
      const { error } = await deleteTask(taskId);
      if (error) { setSubmitErrorMessage(error.message); return; }
      if (editingTaskId === taskId) resetTaskForm();
      await loadTasks();
    } catch (error) {
      setSubmitErrorMessage(error.message || "Unable to delete task.");
    }
  }

  async function markTaskCompleted(taskId) {
    if (!user?.id) return;
    try {
      const { error } = await updateTask(taskId, { status: "completed" }, { changedByUserId: user.id });
      if (error) { setSubmitErrorMessage(error.message); return; }
      await loadTasks();
    } catch (error) {
      setSubmitErrorMessage(error.message || "Unable to update task status.");
    }
  }

  return (
    <div className="tasks-page">
      {/* Left: Create/Edit Form */}
      <aside className="tasks-form-sidebar">
        <div className="tasks-form-card">
          <h2 className="tasks-form-card__title">
            {editingTaskId ? "Edit Task" : "Create Task"}
          </h2>

          {submitErrorMessage && <p className="status-error">{submitErrorMessage}</p>}

          <form className="tasks-form" onSubmit={handleTaskSubmit}>
            <div className="tasks-form__group">
              <label className="tasks-form__label" htmlFor="task-title">Task Title</label>
              <input
                id="task-title" name="title"
                className="tasks-form__input"
                value={taskForm.title}
                onChange={handleTaskFormChange}
                placeholder="Task Title" required
              />
            </div>

            <div className="tasks-form__group">
              <label className="tasks-form__label" htmlFor="task-description">Description</label>
              <textarea
                id="task-description" name="description"
                className="tasks-form__input tasks-form__textarea"
                value={taskForm.description}
                onChange={handleTaskFormChange}
                placeholder="Task description" rows={3}
              />
            </div>

            <div className="tasks-form__group">
              <label className="tasks-form__label" htmlFor="task-deadline">Deadline</label>
              <input
                id="task-deadline" name="deadline" type="datetime-local"
                className="tasks-form__input"
                value={taskForm.deadline}
                onChange={handleTaskFormChange}
                placeholder="Click to set date and time"
              />
            </div>

            <div className="tasks-form__group">
              <label className="tasks-form__label" htmlFor="task-status">Status</label>
              <div className="tasks-form__status-select">
                <span
                  className="tasks-form__status-dot"
                  style={{ background: STATUS_COLORS[taskForm.status] }}
                />
                <select
                  id="task-status" name="status"
                  className="tasks-form__input tasks-form__select"
                  value={taskForm.status}
                  onChange={handleTaskFormChange}
                >
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>

            <div className="tasks-form__group">
              <label className="tasks-form__label">Importance</label>
              <div className="tasks-form__importance-row">
                {IMPORTANCE_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    className={`tasks-form__importance-option ${taskForm.importance === opt.value ? "tasks-form__importance-option--active" : ""}`}
                  >
                    <input
                      type="radio" name="importance"
                      value={opt.value}
                      checked={taskForm.importance === opt.value}
                      onChange={handleTaskFormChange}
                    />
                    <span
                      className="tasks-form__importance-dot"
                      style={{ background: opt.color, borderColor: opt.border }}
                    />
                    <span className="tasks-form__importance-label">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="tasks-form__actions">
              <button type="submit" className="tasks-form__submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : editingTaskId ? "Update Task" : "Create Task"} {editingTaskId ? "✎" : "+"}
              </button>
              {editingTaskId && (
                <button type="button" className="tasks-form__cancel" onClick={resetTaskForm}>
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      </aside>

      {/* Right: Task Lists */}
      <main className="tasks-content">
        {errorMessage && <p className="status-error">{errorMessage}</p>}

        {isLoading && (
          <div className="dashboard-loading">
            <div className="dashboard-loading__spinner" />
            <p>Loading tasks...</p>
          </div>
        )}

        {!isLoading && (
          <>
            {/* Overdue Priority Tasks */}
            <section className="tasks-section">
              <h2 className="tasks-section__title tasks-section__title--alert">
                Alert: Overdue Priority Tasks ({overdueTasks.length})
              </h2>

              {overdueTasks.length === 0 ? (
                <p className="tasks-section__empty">✨ No overdue tasks — you're all caught up!</p>
              ) : (
                <div className="tasks-grid">
                  {overdueTasks.map((task) => (
                    <TaskCard
                      key={task.id} task={task} isOverdue
                      onEdit={beginTaskEdit}
                      onComplete={markTaskCompleted}
                      onDelete={handleTaskDelete}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* Upcoming & Active Tasks */}
            <section className="tasks-section">
              <h2 className="tasks-section__title tasks-section__title--active">
                Upcoming & Active Tasks ({activeTasks.length})
              </h2>

              {activeTasks.length === 0 ? (
                <p className="tasks-section__empty">No active tasks. Create one to get started!</p>
              ) : (
                <div className="tasks-grid">
                  {activeTasks.map((task) => (
                    <TaskCard
                      key={task.id} task={task} isOverdue={false}
                      onEdit={beginTaskEdit}
                      onComplete={markTaskCompleted}
                      onDelete={handleTaskDelete}
                    />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}