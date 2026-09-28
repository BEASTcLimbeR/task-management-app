"use client";

import type { Priority, Task } from "@/lib/api";

type TaskItemProps = {
  task: Task;
  onToggleComplete: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
};

const PRIORITY_STYLES: Record<Priority, string> = {
  low: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
  medium: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  high: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Turn YYYY-MM-DD into a short readable date, e.g. 1 Oct 2026
function formatDueDate(dueDate: string): string {
  const [year, month, day] = dueDate.split("-");
  const monthIndex = Number(month) - 1;
  const monthName = MONTHS[monthIndex] ?? month;
  return `${Number(day)} ${monthName} ${year}`;
}

// Today's date as YYYY-MM-DD in the user's local timezone
function todayIso(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

// A task is overdue if it has a due date before today and is not completed
function isOverdue(task: Task): boolean {
  if (!task.due_date || task.completed) {
    return false;
  }
  return task.due_date < todayIso();
}

// One task row: checkbox, details, edit and delete
export default function TaskItem({
  task,
  onToggleComplete,
  onEdit,
  onDelete,
}: TaskItemProps) {
  return (
    <li className="flex min-w-0 gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/60">
      <input
        type="checkbox"
        checked={task.completed}
        onChange={() => onToggleComplete(task)}
        aria-label={task.completed ? "Mark as pending" : "Mark as completed"}
        className="mt-1 h-4 w-4 shrink-0"
      />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3
            className={
              task.completed
                ? "text-sm font-medium break-words text-slate-500 line-through dark:text-slate-400"
                : "text-sm font-medium break-words text-slate-900 dark:text-slate-100"
            }
          >
            {task.title}
          </h3>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${PRIORITY_STYLES[task.priority]}`}
          >
            {task.priority}
          </span>
        </div>
        {task.description ? (
          <p className="mt-1 text-sm break-words text-slate-600 dark:text-slate-300">
            {task.description}
          </p>
        ) : null}
        {task.due_date ? (
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Due {formatDueDate(task.due_date)}
            {isOverdue(task) ? (
              <span className="ml-2 font-semibold text-red-600 dark:text-red-400">Overdue</span>
            ) : null}
          </p>
        ) : null}
        <div className="mt-2 flex gap-3">
          <button
            type="button"
            onClick={() => onEdit(task)}
            className="text-sm text-sky-800 hover:underline focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:outline-none dark:text-sky-300 dark:focus-visible:ring-sky-400"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => onDelete(task)}
            className="text-sm text-red-700 hover:underline focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:outline-none dark:text-red-400 dark:focus-visible:ring-red-400"
          >
            Delete
          </button>
        </div>
      </div>
    </li>
  );
}
