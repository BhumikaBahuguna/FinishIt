/** CalendarSyncTable.jsx — Table listing syncable tasks and their calendar sync status */
export function CalendarSyncTable({ tasks, syncByTaskId, onSyncTask, isSyncingTaskId }) {
  return (
    <div className="calendar-sync-table-wrapper">
      <table className="calendar-sync-table">
        <thead>
          <tr>
            <th>Task</th>
            <th>Deadline</th>
            <th>Status</th>
            <th>Calendar Sync</th>
            <th>Reminders</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => {
            const syncEntry = syncByTaskId.get(task.id);
            const reminderMinutes = syncEntry?.reminder_minutes ?? [];

            return (
              <tr key={task.id}>
                <td>{task.title}</td>
                <td>{task.deadline ? new Date(task.deadline).toLocaleString() : "No deadline"}</td>
                <td>{task.status}</td>
                <td>
                  <span className={`sync-badge sync-${syncEntry?.sync_status ?? "pending"}`}>
                    {syncEntry?.sync_status ?? "pending"}
                  </span>
                  {syncEntry?.error_message ? (
                    <p className="data-list-meta">{syncEntry.error_message}</p>
                  ) : null}
                </td>
                <td>
                  {reminderMinutes.length > 0
                    ? reminderMinutes.map((value) => `${value}m`).join(", ")
                    : "Auto"}
                </td>
                <td>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => onSyncTask(task)}
                    disabled={isSyncingTaskId === task.id || !task.deadline}
                  >
                    {isSyncingTaskId === task.id ? "Syncing..." : "Sync"}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
