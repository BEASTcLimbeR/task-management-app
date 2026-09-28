"use client";

// Toggle design adapted from Uiverse.io by chase2k25

import { useEffect, useState, type KeyboardEvent } from "react";
import styles from "./ThemeToggle.module.css";

// Apply the theme class on <html> and remember the choice in localStorage
function applyTheme(dark: boolean) {
  document.documentElement.classList.toggle("dark", dark);
  localStorage.setItem("theme", dark ? "dark" : "light");
}

// Build the pill, knob, and LED (colours come from html.dark in CSS)
function SwitchFace() {
  return (
    <span className={styles.track}>
      <span className={styles.knob}>
        <span className={styles.led} />
      </span>
    </span>
  );
}

// Neumorphic header switch that follows the existing theme-init / localStorage logic
export default function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState(false);

  // After hydration, read the class theme-init.js already set (avoids a mismatch)
  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    function onSystemChange(event: MediaQueryListEvent) {
      if (localStorage.getItem("theme")) {
        return;
      }
      document.documentElement.classList.toggle("dark", event.matches);
      setIsDark(event.matches);
    }
    media.addEventListener("change", onSystemChange);
    const timer = window.setTimeout(() => {
      setIsDark(document.documentElement.classList.contains("dark"));
      setMounted(true);
    }, 0);
    return () => {
      media.removeEventListener("change", onSystemChange);
      window.clearTimeout(timer);
    };
  }, []);

  // Flip between light and dark and save the user's choice
  function handleToggle() {
    const next = !document.documentElement.classList.contains("dark");
    applyTheme(next);
    setIsDark(next);
  }

  // Space and Enter both flip the switch (role=switch is not always activated by the browser)
  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === " " || event.key === "Enter") {
      event.preventDefault();
      handleToggle();
    }
  }

  if (!mounted) {
    return (
      <span className={styles.switch} aria-hidden="true">
        <SwitchFace />
      </span>
    );
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label="Toggle dark mode"
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={styles.switch}
      onClick={handleToggle}
      onKeyDown={handleKeyDown}
    >
      <SwitchFace />
    </button>
  );
}
