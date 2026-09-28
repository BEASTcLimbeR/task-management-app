"use client";

import { useCallback, useEffect, useState } from "react";
import FilterTabs from "@/components/FilterTabs";
import TaskForm from "@/components/TaskForm";
import TaskList from "@/components/TaskList";
import {
  API_URL,
  deleteTask,
  isUnreachableError,
  listTasks,
  setCompleted,
  type Task,
  type TaskStatus,
} from "@/lib/api";

// Main task manager page: loads tasks from Flask and wires up the form, filters, and list
export default function HomePage() {
  const [status, setStatus] = useState<TaskStatus>("all");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [apiDown, setApiDown] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Reload the visible list and the tab counts from the API
  const refresh = useCallback(async () => {
    try {
      const [visible, pending, completed] = await Promise.all([
        listTasks(status),
        listTasks("pending"),
        listTasks("completed"),
      ]);
      setTasks(visible);
      setPendingCount(pending.length);
      setCompletedCount(completed.length);
      setApiDown(false);
    } catch (error) {
      if (isUnreachableError(error)) {
        setApiDown(true);
      }
    } finally {
      setLoading(false);
    }
  }, [status]);

  // Load tasks whenever the selected filter changes
  useEffect(() => {
    let cancelled = false;
    Promise.all([
      listTasks(status),
      listTasks("pending"),
      listTasks("completed"),
    ])
      .then(([visible, pending, completed]) => {
        if (cancelled) {
          return;
        }
        setTasks(visible);
        setPendingCount(pending.length);
        setCompletedCount(completed.length);
        setApiDown(false);
        setLoading(false);
      })
      .catch((error: unknown) => {
        if (cancelled) {
          return;
        }
        if (isUnreachableError(error)) {
          setApiDown(true);
        }
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [status]);

  // Mark a task complete or pending, then refresh the list
  async function handleToggleComplete(task: Task) {
    try {
      await setCompleted(task.id, !task.completed);
      await refresh();
    } catch (error) {
      if (isUnreachableError(error)) {
        setApiDown(true);
      }
    }
  }

  // Delete a task after the item already asked for confirmation
  async function handleDelete(task: Task) {
    try {
      await deleteTask(task.id);
      if (editingTask?.id === task.id) {
        setEditingTask(null);
      }
      await refresh();
    } catch (error) {
      if (isUnreachableError(error)) {
        setApiDown(true);
      }
    }
  }

  return (
    <main className="mx-auto w-full max-w-[720px] px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold text-slate-900">My Tasks</h1>
        <p className="mt-1 text-sm text-slate-600">
          {pendingCount} pending · {completedCount} completed
        </p>
      </header>

      {apiDown ? (
        <p
          className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
          role="alert"
        >
          Can&apos;t reach the API at {API_URL} — is the Flask server running?
        </p>
      ) : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <TaskForm
          key={editingTask ? String(editingTask.id) : "new"}
          editingTask={editingTask}
          onCancel={() => setEditingTask(null)}
          onSuccess={async () => {
            setEditingTask(null);
            await refresh();
          }}
          onUnreachable={() => setApiDown(true)}
        />
      </section>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <FilterTabs
          current={status}
          pendingCount={pendingCount}
          completedCount={completedCount}
          onChange={setStatus}
        />
        <div className="mt-4">
          {loading ? (
            <p className="text-sm text-slate-500">Loading tasks...</p>
          ) : apiDown ? null : (
            <TaskList
              tasks={tasks}
              onToggleComplete={handleToggleComplete}
              onEdit={setEditingTask}
              onDelete={handleDelete}
            />
          )}
        </div>
      </section>
    </main>
  );
}
