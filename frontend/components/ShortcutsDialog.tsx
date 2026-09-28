"use client";

import { useEffect, useId, useRef } from "react";
import { useLenis } from "lenis/react";

type ShortcutsDialogProps = {
  open: boolean;
  onClose: () => void;
};

const SHORTCUTS = [
  { keys: "N", action: "Focus the new-task title field" },
  { keys: "/", action: "Focus search" },
  { keys: "1", action: "Show all tasks" },
  { keys: "2", action: "Show pending tasks" },
  { keys: "3", action: "Show completed tasks" },
  { keys: "Esc", action: "Cancel edit, close this dialog, or clear search" },
  { keys: "?", action: "Open this shortcuts list" },
];

// Collect buttons and other tabbable elements inside the dialog
function getFocusable(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((el) => !el.hasAttribute("disabled"));
}

// Small modal that lists keyboard shortcuts and traps focus until it is closed
export default function ShortcutsDialog({ open, onClose }: ShortcutsDialogProps) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const lenis = useLenis();

  // Pause smooth scrolling while the dialog is open so the page behind does not move
  useEffect(() => {
    if (!lenis) {
      return;
    }
    if (open) {
      lenis.stop();
    } else {
      lenis.start();
    }
    return () => {
      lenis.start();
    };
  }, [lenis, open]);

  // Trap Tab inside the dialog, close on Escape, and restore focus when it shuts
  useEffect(() => {
    if (!open) {
      return;
    }

    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const focusable = getFocusable(dialog);
    focusable[0]?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== "Tab" || !dialog) {
        return;
      }
      const items = getFocusable(dialog);
      if (items.length === 0) {
        event.preventDefault();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previouslyFocused?.focus();
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center p-4 sm:items-center" data-lenis-prevent>
      <button
        type="button"
        aria-label="Close shortcuts"
        className="absolute inset-0 bg-slate-900/50 motion-safe:transition-opacity dark:bg-black/60"
        onClick={onClose}
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="animate-dialog-in relative z-10 w-full max-w-md rounded-2xl border border-slate-200 bg-white p-4 shadow-xl dark:border-slate-700 dark:bg-slate-900 sm:p-6"
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <h2 id={titleId} className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Keyboard shortcuts
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close shortcuts"
            className="rounded-lg px-2 py-1 text-sm text-slate-600 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:outline-none dark:text-slate-300 dark:hover:bg-slate-800 dark:focus-visible:ring-sky-400"
          >
            Close
          </button>
        </div>
        <ul className="space-y-2">
          {SHORTCUTS.map((item) => (
            <li key={item.keys} className="flex items-start justify-between gap-4 text-sm">
              <span className="text-slate-600 dark:text-slate-300">{item.action}</span>
              <kbd className="shrink-0 rounded border border-slate-300 bg-slate-50 px-1.5 py-0.5 font-mono text-xs text-slate-800 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100">
                {item.keys}
              </kbd>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
