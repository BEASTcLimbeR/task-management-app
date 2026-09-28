"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Keyboard } from "lucide-react";
import FilterTabs from "@/components/FilterTabs";
import Preloader from "@/components/Preloader";
import SearchSortBar from "@/components/SearchSortBar";
import ShortcutsDialog from "@/components/ShortcutsDialog";
import TaskForm from "@/components/TaskForm";
import TaskList from "@/components/TaskList";
import ThemeToggle from "@/components/ThemeToggle";
import Toasts, { type ToastItem } from "@/components/Toasts";
import LogoutButton from "@/components/LogoutButton";
import { Footer } from "@/components/ui/footer-section";
import {
  API_URL,
  deleteTask,
  isUnreachableError,
  listTasks,
  setCompleted,
  createTask,
  updateTask,
  type Task,
  type TaskInput,
  type TaskStatus,
} from "@/lib/api";
import { matchesSearch, parseSort, parseStatus, sortTasks, type SortKey } from "@/lib/view";

type PendingDelete = {
  task: Task;
  index: number;
  timeoutId: number;
  toastId: string;
};

type HomePageProps = {
  showLogout?: boolean;
};

const emptySubscribe = () => () => undefined;

// True when this browser tab has not shown the local-dev welcome overlay yet
function getWelcomeUnseen(): boolean {
  try {
    return sessionStorage.getItem("tm_welcome_seen") !== "1";
  } catch {
    return false;
  }
}

// Main task manager: optimistic list, undo delete, and URL-synced filter/search/sort
export default function HomePage({ showLogout = false }: HomePageProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const status = parseStatus(searchParams.get("status"));
  const query = searchParams.get("q") ?? "";
  const sort = parseSort(searchParams.get("sort"));
  const welcomeFromUrl = searchParams.get("welcome") === "1";
  const [showPreloader, setShowPreloader] = useState(welcomeFromUrl);
  const [welcomeDismissed, setWelcomeDismissed] = useState(false);
  const welcomeUnseen = useSyncExternalStore(emptySubscribe, getWelcomeUnseen, () => false);
  const preloaderVisible =
    !welcomeDismissed && (showPreloader || (!showLogout && welcomeUnseen));

  const [tasks, setTasks] = useState<Task[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [apiDown, setApiDown] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const closeShortcuts = useCallback(() => setShortcutsOpen(false), []);

  const titleInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const pendingDeletesRef = useRef<Map<number, PendingDelete>>(new Map());
  const focusTitleAfterEditRef = useRef(false);
  const errorTimersRef = useRef<number[]>([]);

  // Write filter/search/sort into the URL without adding extra history entries
  const replaceQuery = useCallback(
    (next: { status?: TaskStatus; q?: string; sort?: SortKey }) => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("welcome");
      const nextStatus = next.status ?? parseStatus(params.get("status"));
      const nextQuery = next.q !== undefined ? next.q : (params.get("q") ?? "");
      const nextSort = next.sort ?? parseSort(params.get("sort"));

      if (nextStatus === "all") {
        params.delete("status");
      } else {
        params.set("status", nextStatus);
      }
      if (nextQuery.trim() === "") {
        params.delete("q");
      } else {
        params.set("q", nextQuery);
      }
      if (nextSort === "due") {
        params.delete("sort");
      } else {
        params.set("sort", nextSort);
      }

      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  // Remove a toast from the stack by id
  const removeToast = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  // Add a toast; error toasts disappear on their own after a few seconds
  const pushToast = useCallback(
    (toast: Omit<ToastItem, "id"> & { id?: string }) => {
      const id = toast.id ?? crypto.randomUUID();
      setToasts((current) => [...current, { ...toast, id }]);
      if (toast.kind === "error") {
        const timer = window.setTimeout(() => removeToast(id), 4000);
        errorTimersRef.current.push(timer);
      }
      return id;
    },
    [removeToast],
  );

  // Put a deleted task back in the list at its old spot and fix the tab counts
  function restoreTask(task: Task, index: number) {
    setTasks((current) => {
      if (current.some((item) => item.id === task.id)) {
        return current;
      }
      const next = [...current];
      next.splice(Math.min(index, next.length), 0, task);
      return next;
    });
    if (task.completed) {
      setCompletedCount((count) => count + 1);
    } else {
      setPendingCount((count) => count + 1);
    }
  }

  // Cancel a pending DELETE and put the task back (no API call)
  function undoDelete(taskId: number) {
    const pending = pendingDeletesRef.current.get(taskId);
    if (!pending) {
      return;
    }
    window.clearTimeout(pending.timeoutId);
    pendingDeletesRef.current.delete(taskId);
    restoreTask(pending.task, pending.index);
    removeToast(pending.toastId);
  }

  // Load the visible list and tab counts whenever the status filter in the URL changes
  useEffect(() => {
    let cancelled = false;
    Promise.all([listTasks(status), listTasks("pending"), listTasks("completed")])
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

  // After Esc/N cancels edit, focus the new-task title once the add form remounts
  useEffect(() => {
    if (!editingTask && focusTitleAfterEditRef.current) {
      focusTitleAfterEditRef.current = false;
      titleInputRef.current?.focus();
    }
  }, [editingTask]);

  // If the tab closes during the 5s undo window, still send any pending DELETEs
  useEffect(() => {
    function flushPendingDeletes() {
      pendingDeletesRef.current.forEach(({ task, timeoutId }) => {
        window.clearTimeout(timeoutId);
        void fetch(`${API_URL}/api/tasks/${task.id}`, {
          method: "DELETE",
          keepalive: true,
        });
      });
      pendingDeletesRef.current.clear();
    }

    const errorTimers = errorTimersRef;
    window.addEventListener("pagehide", flushPendingDeletes);
    window.addEventListener("beforeunload", flushPendingDeletes);
    return () => {
      window.removeEventListener("pagehide", flushPendingDeletes);
      window.removeEventListener("beforeunload", flushPendingDeletes);
      errorTimers.current.forEach((timer) => window.clearTimeout(timer));
    };
  }, []);

  // Drop welcome=1 from the URL so a refresh does not play the overlay again
  useLayoutEffect(() => {
    if (!welcomeFromUrl) {
      return;
    }
    const params = new URLSearchParams(searchParams.toString());
    params.delete("welcome");
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [pathname, router, searchParams, welcomeFromUrl]);

  // Keyboard shortcuts; ignored while typing except Escape
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (showPreloader || preloaderVisible) {
        return;
      }
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName;
      const typing =
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        Boolean(target?.isContentEditable);

      if (event.key === "Escape") {
        event.preventDefault();
        if (shortcutsOpen) {
          closeShortcuts();
        } else if (editingTask) {
          setEditingTask(null);
        } else if (query) {
          replaceQuery({ q: "" });
        }
        return;
      }

      if (typing || shortcutsOpen) {
        return;
      }

      if (event.key === "n" || event.key === "N") {
        event.preventDefault();
        if (editingTask) {
          focusTitleAfterEditRef.current = true;
          setEditingTask(null);
        } else {
          titleInputRef.current?.focus();
        }
        return;
      }
      if (event.key === "/") {
        event.preventDefault();
        searchInputRef.current?.focus();
        return;
      }
      if (event.key === "1") {
        replaceQuery({ status: "all" });
        return;
      }
      if (event.key === "2") {
        replaceQuery({ status: "pending" });
        return;
      }
      if (event.key === "3") {
        replaceQuery({ status: "completed" });
        return;
      }
      if (event.key === "?") {
        event.preventDefault();
        setShortcutsOpen(true);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [closeShortcuts, editingTask, query, replaceQuery, shortcutsOpen, showPreloader, preloaderVisible]);

  // Create waits for Flask so the list uses the real id and timestamps
  async function handleCreate(data: TaskInput) {
    const created = await createTask(data);
    setPendingCount((count) => count + 1);
    if (status !== "completed") {
      setTasks((current) => [created, ...current]);
    }
    setApiDown(false);
  }

  // Edit updates the row immediately, then PUT; roll back if the API fails
  async function handleUpdate(id: number, data: TaskInput) {
    const snapshot = tasks;
    const previous = tasks.find((task) => task.id === id);
    if (!previous) {
      return;
    }
    const optimistic: Task = {
      ...previous,
      title: data.title,
      description: data.description ?? "",
      priority: data.priority ?? previous.priority,
      due_date: data.due_date === undefined ? previous.due_date : data.due_date,
    };
    setTasks((current) => current.map((task) => (task.id === id ? optimistic : task)));
    setEditingTask(null);
    try {
      const saved = await updateTask(id, data);
      setTasks((current) => current.map((task) => (task.id === id ? saved : task)));
      setApiDown(false);
    } catch (error) {
      setTasks(snapshot);
      pushToast({
        kind: "error",
        message: error instanceof Error ? error.message : "Could not save changes",
      });
      if (isUnreachableError(error)) {
        setApiDown(true);
      }
    }
  }

  // Toggle complete in the UI first, then PATCH; restore the old row on failure
  async function handleToggleComplete(task: Task) {
    const snapshotTasks = tasks;
    const snapshotPending = pendingCount;
    const snapshotCompleted = completedCount;
    const nextCompleted = !task.completed;

    setTasks((current) => {
      const updated = current.map((item) =>
        item.id === task.id ? { ...item, completed: nextCompleted } : item,
      );
      if (status === "pending" && nextCompleted) {
        return updated.filter((item) => item.id !== task.id);
      }
      if (status === "completed" && !nextCompleted) {
        return updated.filter((item) => item.id !== task.id);
      }
      return updated;
    });
    if (nextCompleted) {
      setPendingCount((count) => Math.max(0, count - 1));
      setCompletedCount((count) => count + 1);
    } else {
      setPendingCount((count) => count + 1);
      setCompletedCount((count) => Math.max(0, count - 1));
    }

    try {
      const saved = await setCompleted(task.id, nextCompleted);
      setTasks((current) => {
        if (status === "pending" && saved.completed) {
          return current.filter((item) => item.id !== saved.id);
        }
        if (status === "completed" && !saved.completed) {
          return current.filter((item) => item.id !== saved.id);
        }
        if (current.some((item) => item.id === saved.id)) {
          return current.map((item) => (item.id === saved.id ? saved : item));
        }
        return current;
      });
      setApiDown(false);
    } catch (error) {
      setTasks(snapshotTasks);
      setPendingCount(snapshotPending);
      setCompletedCount(snapshotCompleted);
      pushToast({
        kind: "error",
        message: error instanceof Error ? error.message : "Could not update task",
      });
      if (isUnreachableError(error)) {
        setApiDown(true);
      }
    }
  }

  // Remove the task immediately and wait 5 seconds before calling DELETE
  function handleDelete(task: Task) {
    if (editingTask?.id === task.id) {
      setEditingTask(null);
    }
    const index = tasks.findIndex((item) => item.id === task.id);
    setTasks((current) => current.filter((item) => item.id !== task.id));
    if (task.completed) {
      setCompletedCount((count) => Math.max(0, count - 1));
    } else {
      setPendingCount((count) => Math.max(0, count - 1));
    }

    const toastId = crypto.randomUUID();
    const timeoutId = window.setTimeout(() => {
      pendingDeletesRef.current.delete(task.id);
      removeToast(toastId);
      void deleteTask(task.id).catch((error: unknown) => {
        restoreTask(task, index);
        pushToast({
          kind: "error",
          message: error instanceof Error ? error.message : "Could not delete task",
        });
        if (isUnreachableError(error)) {
          setApiDown(true);
        }
      });
    }, 5000);

    pendingDeletesRef.current.set(task.id, { task, index, timeoutId, toastId });
    pushToast({
      id: toastId,
      kind: "undo",
      message: "Task deleted",
      actionLabel: "Undo",
      onAction: () => undoDelete(task.id),
    });
  }

  const visibleTasks = useMemo(
    () => sortTasks(tasks.filter((task) => matchesSearch(task, query)), sort),
    [query, sort, tasks],
  );

  // Scroll to the add form and focus Title, same as the N shortcut
  function handleFooterAddTask() {
    document.getElementById("add-task")?.scrollIntoView({ behavior: "smooth", block: "start" });
    if (editingTask) {
      focusTitleAfterEditRef.current = true;
      setEditingTask(null);
    } else {
      titleInputRef.current?.focus();
    }
  }

  // Set the Pending filter (same as shortcut 2) and scroll to the list
  function handleFooterPending() {
    replaceQuery({ status: "pending" });
    document.getElementById("task-list")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // Set the Completed filter (same as shortcut 3) and scroll to the list
  function handleFooterCompleted() {
    replaceQuery({ status: "completed" });
    document.getElementById("task-list")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // Hide the overlay and remember it for this browser tab (local-dev / no login gate)
  function handlePreloaderFinished() {
    setShowPreloader(false);
    setWelcomeDismissed(true);
    try {
      sessionStorage.setItem("tm_welcome_seen", "1");
    } catch {
      // Private mode can block sessionStorage
    }
  }

  return (
    <>
    {preloaderVisible ? (
      <Preloader onFinished={handlePreloaderFinished} />
    ) : null}
    <div className="min-w-0 max-w-full overflow-x-clip" inert={preloaderVisible ? true : undefined}>
    <main className="mx-auto w-full min-w-0 max-w-[720px] px-4 py-8 pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))]">
      <header className="mb-6 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold leading-snug break-words text-slate-900 sm:text-2xl dark:text-slate-100">Task Manager App</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            {pendingCount} pending · {completedCount} completed
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            aria-label="Keyboard shortcuts"
            title="Keyboard shortcuts (?)"
            onClick={() => setShortcutsOpen(true)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-200/80 focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:outline-none dark:text-slate-300 dark:hover:bg-slate-800 dark:focus-visible:ring-sky-400"
          >
            <Keyboard className="h-4 w-4" aria-hidden="true" />
          </button>
          {showLogout ? <LogoutButton /> : null}
          <ThemeToggle />
        </div>
      </header>

      {apiDown ? (
        <p
          className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200"
          role="alert"
        >
          Can&apos;t reach the API at {API_URL} — is the Flask server running?
        </p>
      ) : null}

      <section id="add-task" className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-6">
        <TaskForm
          key={editingTask ? String(editingTask.id) : "new"}
          editingTask={editingTask}
          titleInputRef={titleInputRef}
          onCancel={() => setEditingTask(null)}
          onCreate={handleCreate}
          onUpdate={handleUpdate}
          onUnreachable={() => setApiDown(true)}
        />
      </section>

      <section id="task-list" className="mt-6 min-w-0 overflow-x-clip rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-6">
        <FilterTabs
          current={status}
          pendingCount={pendingCount}
          completedCount={completedCount}
          onChange={(next) => replaceQuery({ status: next })}
        />
        <SearchSortBar
          query={query}
          sort={sort}
          searchRef={searchInputRef}
          onQueryChange={(value) => replaceQuery({ q: value })}
          onSortChange={(value) => replaceQuery({ sort: value })}
        />
        <div className="mt-4">
          {loading && tasks.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">Loading tasks...</p>
          ) : (
            <TaskList
              tasks={visibleTasks}
              emptyMessage={
                query.trim() ? "No tasks match your search" : "No tasks here yet"
              }
              onToggleComplete={handleToggleComplete}
              onEdit={setEditingTask}
              onDelete={handleDelete}
            />
          )}
        </div>
      </section>

      <ShortcutsDialog open={shortcutsOpen} onClose={closeShortcuts} />
      <Toasts toasts={toasts} />
    </main>
    <Footer
      onAddTask={handleFooterAddTask}
      onPendingTasks={handleFooterPending}
      onCompletedTasks={handleFooterCompleted}
      onOpenShortcuts={() => setShortcutsOpen(true)}
    />
    </div>
    </>
  );
}
