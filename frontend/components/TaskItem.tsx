"use client";

import type { Priority, Task } from "@/lib/api";

type TaskItemProps = {
  task: Task;
  onToggleComplete: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
};

const PRIORITY_STYLES: Record<Priority, string> = {
  low: "bg-green-100 text-green-800",
  medium: "bg-amber-100 text-amber-800",
  high: "bg-red-100 text-red-800",
};

// Turn YYYY-MM-DD into a short readable date, e.g. 1 Oct 2026
function formatDueDate(dueDate: string): string {
  const date = new Date(dueDate + "T00:00:00");
  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
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
  // Ask before deleting so a mis-click does not remove a task
  function handleDelete() {
    if (window.confirm("Delete this task?")) {
      onDelete(task);
    }
  }

  return (
    <li className="flex gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
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
                ? "text-sm font-medium text-slate-500 line-through"
                : "text-sm font-medium text-slate-900"
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
          <p className="mt-1 text-sm text-slate-600">{task.description}</p>
        ) : null}
        {task.due_date ? (
          <p className="mt-1 text-xs text-slate-500">
            Due {formatDueDate(task.due_date)}
            {isOverdue(task) ? (
              <span className="ml-2 font-semibold text-red-600">Overdue</span>
            ) : null}
          </p>
        ) : null}
        <div className="mt-2 flex gap-3">
          <button
            type="button"
            onClick={() => onEdit(task)}
            className="text-sm text-sky-800 hover:underline"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="text-sm text-red-700 hover:underline"
          >
            Delete
          </button>
        </div>
      </div>
    </li>
  );
}
