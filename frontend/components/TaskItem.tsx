"use client";

import type { Priority, Task } from "@/lib/api";
import styles from "./TaskItem.module.css";

type TaskItemProps = {
  task: Task;
  onToggleComplete: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
};

const PRIORITY_WORDS: Record<Priority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
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

// A task is due today if the date matches today and it is still pending
function isDueToday(task: Task): boolean {
  if (!task.due_date || task.completed) {
    return false;
  }
  return task.due_date === todayIso();
}

// One task card: tinted by priority, with checkbox, edit and delete
export default function TaskItem({
  task,
  onToggleComplete,
  onEdit,
  onDelete,
}: TaskItemProps) {
  const priorityWord = PRIORITY_WORDS[task.priority];
  const overdue = isOverdue(task);
  const dueToday = isDueToday(task);

  return (
    <li
      className={`${styles.card} ${task.completed ? styles.completed : ""} animate-fade-up`}
      data-priority={task.priority}
      aria-label={`${priorityWord} priority task: ${task.title}`}
    >
      <input
        type="checkbox"
        checked={task.completed}
        onChange={() => onToggleComplete(task)}
        aria-label={task.completed ? "Mark as pending" : "Mark as completed"}
        className={styles.checkbox}
      />
      <div className={styles.body}>
        <div className={styles.top}>
          <h3 className={task.completed ? styles.titleDone : styles.title}>{task.title}</h3>
          <span className={styles.priorityLabel}>{priorityWord}</span>
        </div>
        {task.description ? <p className={styles.description}>{task.description}</p> : null}
        {task.due_date ? (
          <p className={styles.due}>
            Due {formatDueDate(task.due_date)}
            {overdue ? <span className={styles.overdue}>Overdue</span> : null}
            {dueToday ? <span className={styles.dueToday}>Due today</span> : null}
          </p>
        ) : null}
        <div className={styles.actions}>
          <button type="button" onClick={() => onEdit(task)} className={styles.action}>
            Edit
          </button>
          <button
            type="button"
            onClick={() => onDelete(task)}
            className={`${styles.action} ${styles.delete}`}
          >
            Delete
          </button>
        </div>
      </div>
    </li>
  );
}
