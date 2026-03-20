import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../../auth/hooks/useAuth";
import { createTask, deleteTask, listTasksByUser, updateTask } from "../services/tasksApi";
import {
  buildEisenhowerMatrix,
  EISENHOWER_QUADRANTS,
  getOverdueTasks,
  isTaskUrgent,
  prioritizeTasks
} from "../services/taskPrioritization";
import { Button } from "../../../shared/components/ui/Button";
import { Card } from "../../../shared/components/ui/Card";
import { PageHeader } from "../../../shared/components/ui/PageHeader";
import { validateTaskPayload } from "../../../shared/utils/validation";

const DEFAULT_TASK_FORM = {
  title: "",
  description: "",
  deadline: "",
  importance: "no",
  status: "pending"
};

const QUADRANT_RENDER_ORDER = [
  EISENHOWER_QUADRANTS.DO_FIRST,
  EISENHOWER_QUADRANTS.SCHEDULE,
  EISENHOWER_QUADRANTS.DELEGATE,
  EISENHOWER_QUADRANTS.ELIMINATE
];

function toLocalDateTimeValue(isoString) {
  if (!isoString) return "";

  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const timezoneOffsetMilliseconds = date.getTimezoneOffset() * 60 * 1000;
  const localDate = new Date(date.getTime() - timezoneOffsetMilliseconds);
  return localDate.toISOString().slice(0, 16);
}

function toDatabaseDateTime(localDateTime) {
  if (!localDateTime) return null;

  const parsedDate = new Date(localDateTime);
  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  return parsedDate.toISOString();
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

  const prioritizedTasks = useMemo(() => prioritizeTasks(tasks), [tasks]);
  const matrix = useMemo(() => buildEisenhowerMatrix(prioritizedTasks), [prioritizedTasks]);
  const overdueTasks = useMemo(() => getOverdueTasks(tasks), [tasks]);

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

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      setTasks(data ?? []);
    } catch (error) {
      setErrorMessage(error.message || "Unable to load tasks.");
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  function handleTaskFormChange(event) {
    const { name, value } = event.target;

    setTaskForm((previous) => ({
      ...previous,
      [name]: value
    }));
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

    // Auto-compute urgency from the deadline
    const urgency = deadline ? isTaskUrgent({ deadline }, new Date()) : false;

    const payload = {
      title: taskForm.title.trim(),
      description: taskForm.description.trim() || null,
      deadline,
      urgency,
      importance: taskForm.importance === "yes",
      status: taskForm.status
    };

    const validation = validateTaskPayload(payload, {
      partial: false
    });

    if (!validation.isValid) {
      setIsSubmitting(false);
      setSubmitErrorMessage(validation.errors.join(" "));
      return;
    }

    try {
      if (editingTaskId) {
        const { error } = await updateTask(editingTaskId, payload, {
          changedByUserId: user.id
        });

        if (error) {
          setSubmitErrorMessage(error.message);
          return;
        }
      } else {
        const { error } = await createTask({
          ...payload,
          user_id: user.id
        });

        if (error) {
          setSubmitErrorMessage(error.message);
          return;
        }
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

      if (error) {
        setSubmitErrorMessage(error.message);
        return;
      }

      if (editingTaskId === taskId) {
        resetTaskForm();
      }

      await loadTasks();
    } catch (error) {
      setSubmitErrorMessage(error.message || "Unable to delete task.");
    }
  }

  async function markTaskCompleted(taskId) {
    if (!user?.id) return;

    try {
      const { error } = await updateTask(
        taskId,
        {
          status: "completed"
        },
        { changedByUserId: user.id }
      );

      if (error) {
        setSubmitErrorMessage(error.message);
        return;
      }

      await loadTasks();
    } catch (error) {
      setSubmitErrorMessage(error.message || "Unable to update task status.");
    }
  }

  return (
    <div className="page-content">
      <PageHeader
        title="Task Management"
        subtitle="Create, organize, and prioritize your tasks."
      />

      <Card title={editingTaskId ? "Edit Task" : "Create Task"}>
        {submitErrorMessage ? <p className="status-error">{submitErrorMessage}</p> : null}

        <form className="data-form" onSubmit={handleTaskSubmit}>
          <label htmlFor="task-title">Title</label>
          <input
            id="task-title"
            name="title"
            value={taskForm.title}
            onChange={handleTaskFormChange}
            placeholder="Task title"
            required
          />

          <label htmlFor="task-description">Description</label>
          <textarea
            id="task-description"
            name="description"
            value={taskForm.description}
            onChange={handleTaskFormChange}
            placeholder="Task description"
            rows={3}
          />

          <div className="form-grid-2">
            <div>
              <label htmlFor="task-deadline">Deadline</label>
              <input
                id="task-deadline"
                name="deadline"
                type="datetime-local"
                value={taskForm.deadline}
                onChange={handleTaskFormChange}
              />
            </div>

            <div>
              <label htmlFor="task-status">Status</label>
              <select
                id="task-status"
                name="status"
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

          <div>
            <label htmlFor="task-importance">Is this task important?</label>
            <select
              id="task-importance"
              name="importance"
              value={taskForm.importance}
              onChange={handleTaskFormChange}
            >
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>

          <div className="actions-row">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : editingTaskId ? "Update Task" : "Create Task"}
            </Button>
            {editingTaskId ? (
              <Button type="button" variant="secondary" onClick={resetTaskForm}>
                Cancel Edit
              </Button>
            ) : null}
          </div>
        </form>
      </Card>

      <Card title="Task List">
        {isLoading ? <p>Loading tasks...</p> : null}
        {!isLoading && errorMessage ? <p className="status-error">{errorMessage}</p> : null}
        {!isLoading && !errorMessage && tasks.length === 0 ? <p>No tasks found.</p> : null}

        {!isLoading && !errorMessage && tasks.length > 0 ? (
          <ul className="data-list">
            {tasks.map((task) => (
              <li key={task.id} className="data-list-item">
                <h3>{task.title}</h3>
                <p className="data-list-meta">Status: {task.status}</p>
                <p className="data-list-meta">
                  Deadline: {task.deadline ? new Date(task.deadline).toLocaleString() : "No deadline"}
                </p>

                <div className="actions-row">
                  <Button type="button" variant="secondary" onClick={() => beginTaskEdit(task)}>
                    Edit
                  </Button>

                  {task.status !== "completed" ? (
                    <Button type="button" variant="secondary" onClick={() => markTaskCompleted(task.id)}>
                      Mark Completed
                    </Button>
                  ) : null}

                  <Button type="button" variant="secondary" onClick={() => handleTaskDelete(task.id)}>
                    Delete
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        ) : null}
      </Card>

      <Card title={`Overdue Tasks (${overdueTasks.length})`}>
        {overdueTasks.length === 0 ? <p>No overdue tasks.</p> : null}

        {overdueTasks.length > 0 ? (
          <ul className="data-list">
            {overdueTasks.map((task) => (
              <li key={task.id} className="data-list-item">
                <h3>{task.title}</h3>
                <p className="data-list-meta">Due: {new Date(task.deadline).toLocaleString()}</p>
                <p className="data-list-meta">Overdue by {task.overdueDays + 1} day(s)</p>
              </li>
            ))}
          </ul>
        ) : null}
      </Card>

      <Card title="Eisenhower Matrix">
        <section className="matrix-grid">
          {QUADRANT_RENDER_ORDER.map((quadrant) => (
            <article key={quadrant} className="matrix-quadrant">
              <h3>
                {matrix[quadrant][0]?.quadrantLabel ||
                  (quadrant === EISENHOWER_QUADRANTS.DO_FIRST
                    ? "Urgent and Important"
                    : quadrant === EISENHOWER_QUADRANTS.SCHEDULE
                      ? "Important but Not Urgent"
                      : quadrant === EISENHOWER_QUADRANTS.DELEGATE
                        ? "Urgent but Not Important"
                        : "Neither Urgent nor Important")}
              </h3>

              {matrix[quadrant].length === 0 ? <p className="data-list-meta">No tasks.</p> : null}

              {matrix[quadrant].length > 0 ? (
                <ul className="data-list">
                  {matrix[quadrant].map((task) => (
                    <li key={task.id} className="data-list-item">
                      <h4>{task.title}</h4>
                      <p className="data-list-meta">
                        {task.isUrgent ? "⚡ Urgent" : "Not Urgent"} | {task.isImportant ? "⭐ Important" : "Not Important"}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : null}
            </article>
          ))}
        </section>
      </Card>
    </div>
  );
}