/** OverviewStats.jsx — Dashboard KPI statistics grid (total tasks, overdue, habits done today) */
import { Card } from "../../../shared/components/ui/Card";

const STAT_CARDS = [
  { key: "totalTasks", label: "Total Tasks" },
  { key: "pendingTasks", label: "Active Tasks" },
  { key: "overdueTasks", label: "Overdue Tasks" },
  { key: "completedTasks", label: "Completed Tasks" },
  { key: "totalHabits", label: "Total Habits" },
  { key: "completedHabitsToday", label: "Habits Done Today" }
];

export function OverviewStats({ stats }) {
  return (
    <section className="kpi-grid" aria-label="Dashboard summary statistics">
      {STAT_CARDS.map((item) => (
        <Card key={item.key}>
          <div className="kpi-card">
            <p className="kpi-label">{item.label}</p>
            <p className="kpi-value">{stats[item.key] ?? 0}</p>
          </div>
        </Card>
      ))}
    </section>
  );
}
