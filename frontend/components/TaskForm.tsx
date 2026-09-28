"use client";

import { useState, type FormEvent } from "react";
import {
  createTask,
  isUnreachableError,
  updateTask,
  type Priority,
  type Task,
} from "@/lib/api";

type TaskFormProps = {
  editingTask: Task | null;
  onCancel: () => void;
  onSuccess: () => Promise<void>;
  onUnreachable: () => void;
};

// Add or edit a task; the same fields are used in both modes
export default function TaskForm({
  editingTask,
  onCancel,
  onSuccess,
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

  // Save a new task or update the one being edited
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSaving(true);
    const data = {
      title: title.trim(),
      description,
      priority,
      due_date: dueDate === "" ? null : dueDate,
    };
    try {
      if (editingTask) {
        await updateTask(editingTask.id, data);
      } else {
        await createTask(data);
      }
      setTitle("");
      setDescription("");
      setPriority("medium");
      setDueDate("");
      await onSuccess();
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
      <h2 className="text-sm font-semibold text-slate-700">
        {isEditing ? "Edit task" : "Add a task"}
      </h2>
      <label className="block">
        <span className="mb-1 block text-sm text-slate-600">Title</span>
        <input
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          required
          maxLength={200}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-sky-500 focus:ring-2"
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm text-slate-600">Description</span>
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={3}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-sky-500 focus:ring-2"
        />
      </label>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm text-slate-600">Priority</span>
          <select
            value={priority}
            onChange={(event) => setPriority(event.target.value as Priority)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none ring-sky-500 focus:ring-2"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-sm text-slate-600">Due date</span>
          <input
            type="date"
            value={dueDate}
            onChange={(event) => setDueDate(event.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-sky-500 focus:ring-2"
          />
        </label>
      </div>
      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-sky-700 px-4 py-2 text-sm font-medium text-white hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "Saving..." : isEditing ? "Save changes" : "Add task"}
        </button>
        {isEditing ? (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
        ) : null}
      </div>
    </form>
  );
}
