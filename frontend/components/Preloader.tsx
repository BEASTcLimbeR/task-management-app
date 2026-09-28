"use client";

import { useEffect, useRef, useState } from "react";
import Loader from "@/components/ui/loader";

type PreloaderProps = {
  onFinished: () => void;
};

// Full-screen overlay shown once after login, then faded off
export default function Preloader({ onFinished }: PreloaderProps) {
  const [fading, setFading] = useState(false);
  const finishingRef = useRef(false);
  const onFinishedRef = useRef(onFinished);

  useEffect(() => {
    onFinishedRef.current = onFinished;
  }, [onFinished]);

  // Fade out, then tell the parent to unmount this overlay
  function finish() {
    if (finishingRef.current) {
      return;
    }
    finishingRef.current = true;
    setFading(true);
    window.setTimeout(() => {
      onFinishedRef.current();
    }, 300);
  }

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const waitMs = reduced ? 600 : 2000;
    const timer = window.setTimeout(finish, waitMs);
    window.addEventListener("keydown", finish);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("keydown", finish);
    };
    // Mount-only timer and skip listener; finish reads refs
  }, []);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading Task Manager App"
      onClick={finish}
      className={
        fading
          ? "fixed inset-0 z-[100] flex cursor-pointer flex-col items-center justify-center bg-slate-100 opacity-0 transition-opacity duration-300 dark:bg-slate-950"
          : "fixed inset-0 z-[100] flex cursor-pointer flex-col items-center justify-center bg-slate-100 opacity-100 transition-opacity duration-300 dark:bg-slate-950"
      }
    >
      <Loader />
      <p className="mt-6 text-2xl font-bold text-slate-900 dark:text-slate-100">
        Task Manager App
      </p>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
        Getting your tasks ready…
      </p>
    </div>
  );
}
