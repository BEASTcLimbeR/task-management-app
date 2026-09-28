"use client";

import { useState, type FormEvent, type RefObject } from "react";
import DueDatePicker from "@/components/DueDatePicker";
import PriorityControl from "@/components/PriorityControl";
import { isUnreachableError, type Priority, type Task, type TaskInput } from "@/lib/api";

type TaskFormProps = {
  editingTask: Task | null;
  titleInputRef: RefObject<HTMLInputElement | null>;
  onCancel: () => void;
  onCreate: (data: TaskInput) => Promise<void>;
  onUpdate: (id: number, data: TaskInput) => Promise<void>;
  onUnreachable: () => void;
};

const fieldClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-sky-500 focus-visible:ring-2 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:ring-sky-400";

// Add or edit a task; the same fields are used in both modes
export default function TaskForm({
  editingTask,
  titleInputRef,
  onCancel,
  onCreate,
  onUpdate,
  onUnreachable,
}: TaskFormProps) {
  const [title, setTitle] = useState(editingTask?.title ?? "");
  const [description, setDescription] = useState(editingTask?.description ?? "");
  const [priority, setPriority] = useState<Priority>(
    editingTask?.priority ?? "medium",
  );
  const [dueDate, setDueDate] = useState(editingTask?.due_date ?? "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  // Save a new task (waits for the server id) or submit an edit for an optimistic update
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSaving(true);
    const data: TaskInput = {
      title: title.trim(),
      description,
      priority,
      due_date: dueDate === "" ? null : dueDate,
    };
    try {
      if (editingTask) {
        await onUpdate(editingTask.id, data);
      } else {
        await onCreate(data);
        setTitle("");
        setDescription("");
        setPriority("medium");
        setDueDate("");
      }
    } catch (err) {
      if (isUnreachableError(err)) {
        onUnreachable();
      } else if (err instanceof Error) {
        setError(err.message);
      }
    } finally {
      setSaving(false);
    }
  }

  const isEditing = editingTask !== null;

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <h2 className="text-sm font-bold text-slate-700 dark:text-slate-200">
        {isEditing ? "Edit task" : "Add a task"}
      </h2>
      <label className="block">
        <span className="mb-1 block text-sm text-slate-600 dark:text-slate-300">Title</span>
        <input
          ref={titleInputRef}
          id="new-task-title"
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          required
          maxLength={200}
          className={fieldClass}
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm text-slate-600 dark:text-slate-300">Description</span>
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={3}
          className={fieldClass}
        />
      </label>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="block min-w-0">
          <span className="mb-1 block text-sm text-slate-600 dark:text-slate-300">Priority</span>
          <PriorityControl value={priority} onChange={setPriority} />
        </div>
        <div className="block min-w-0">
          <span className="mb-1 block text-sm text-slate-600 dark:text-slate-300">Due date</span>
          <DueDatePicker value={dueDate} onChange={setDueDate} className={fieldClass} />
        </div>
      </div>
      {error ? (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-sky-700 px-4 py-2 text-sm font-medium text-white hover:bg-sky-800 focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60 dark:bg-sky-600 dark:hover:bg-sky-500 dark:focus-visible:ring-sky-400"
        >
          {saving ? "Saving..." : isEditing ? "Save changes" : "Add task"}
        </button>
        {isEditing ? (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:outline-none dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800 dark:focus-visible:ring-sky-400"
          >
            Cancel
          </button>
        ) : null}
      </div>
    </form>
  );
}
