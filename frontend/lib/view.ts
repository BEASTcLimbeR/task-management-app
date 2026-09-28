import type { Task, TaskStatus } from "@/lib/api";

export type SortKey = "due" | "priority" | "newest";

// Read a status query value, or fall back to All when it is missing or invalid
export function parseStatus(value: string | null): TaskStatus {
  if (value === "all" || value === "pending" || value === "completed") {
    return value;
  }
  return "all";
}

// Read a sort query value, or fall back to due date when it is missing or invalid
export function parseSort(value: string | null): SortKey {
  if (value === "due" || value === "priority" || value === "newest") {
    return value;
  }
  return "due";
}

// True when the task title or description contains the search text (case-insensitive)
export function matchesSearch(task: Task, query: string): boolean {
  const needle = query.trim().toLowerCase();
  if (!needle) {
    return true;
  }
  return (
    task.title.toLowerCase().includes(needle) ||
    task.description.toLowerCase().includes(needle)
  );
}

// Sort tasks by due date (no date last), priority (high first), or newest created
export function sortTasks(tasks: Task[], sort: SortKey): Task[] {
  const copy = [...tasks];
  const priorityRank = { high: 0, medium: 1, low: 2 };

  copy.sort((a, b) => {
    if (sort === "priority") {
      return priorityRank[a.priority] - priorityRank[b.priority];
    }
    if (sort === "newest") {
      return b.created_at.localeCompare(a.created_at);
    }
    if (!a.due_date && !b.due_date) {
      return 0;
    }
    if (!a.due_date) {
      return 1;
    }
    if (!b.due_date) {
      return -1;
    }
    return a.due_date.localeCompare(b.due_date);
  });

  return copy;
}
