"use client";

export type ToastItem = {
  id: string;
  kind: "error" | "undo";
  message: string;
  actionLabel?: string;
  onAction?: () => void;
};

type ToastsProps = {
  toasts: ToastItem[];
};

// Show up to three toasts in the bottom-right corner
export default function Toasts({ toasts }: ToastsProps) {
  const visible = toasts.slice(-3);

  if (visible.length === 0) {
    return null;
  }

  return (
    <div
      className="pointer-events-none fixed right-4 bottom-4 z-50 flex w-[min(calc(100%-2rem),22rem)] flex-col gap-2"
      aria-live="polite"
      aria-relevant="additions text"
    >
      {visible.map((toast) => (
        <div
          key={toast.id}
          role={toast.kind === "error" ? "alert" : "status"}
          className={
            toast.kind === "error"
              ? "pointer-events-auto rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 shadow-lg dark:border-red-800 dark:bg-red-950 dark:text-red-200"
              : "pointer-events-auto rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-lg dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
          }
        >
          <span>{toast.message}</span>
          {toast.actionLabel && toast.onAction ? (
            <>
              <span aria-hidden="true"> · </span>
              <button
                type="button"
                onClick={toast.onAction}
                className="font-medium text-sky-800 underline-offset-2 hover:underline focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:outline-none dark:text-sky-300 dark:focus-visible:ring-sky-400"
              >
                {toast.actionLabel}
              </button>
            </>
          ) : null}
        </div>
      ))}
    </div>
  );
}
