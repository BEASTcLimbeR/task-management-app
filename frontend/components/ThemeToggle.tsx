"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

// Apply the theme class on <html> and remember the choice in localStorage
function applyTheme(dark: boolean) {
  document.documentElement.classList.toggle("dark", dark);
  localStorage.setItem("theme", dark ? "dark" : "light");
}

// Sun/moon button in the header that switches light and dark mode
export default function ThemeToggle() {
  const [ready, setReady] = useState(false);

  // Wait until after hydration so the sun/moon icon matches the class theme-init.js set
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    function onSystemChange(event: MediaQueryListEvent) {
      if (localStorage.getItem("theme")) {
        return;
      }
      document.documentElement.classList.toggle("dark", event.matches);
    }
    media.addEventListener("change", onSystemChange);
    const timer = window.setTimeout(() => setReady(true), 0);
    return () => {
      media.removeEventListener("change", onSystemChange);
      window.clearTimeout(timer);
    };
  }, []);

  // Flip between light and dark and save the user's choice
  function handleToggle() {
    const next = !document.documentElement.classList.contains("dark");
    applyTheme(next);
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-label="Toggle color theme"
      className="rounded-lg border border-slate-300 p-2 text-slate-700 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:outline-none dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800 dark:focus-visible:ring-sky-400"
    >
      {ready ? (
        <>
          <Sun className="hidden h-4 w-4 dark:block" aria-hidden="true" />
          <Moon className="block h-4 w-4 dark:hidden" aria-hidden="true" />
        </>
      ) : (
        <span className="block h-4 w-4" aria-hidden="true" />
      )}
    </button>
  );
}
