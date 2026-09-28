"use client";

import { useEffect, useRef, useState } from "react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import styles from "./DueDatePicker.module.css";

type DueDatePickerProps = {
  value: string;
  onChange: (value: string) => void;
  className: string;
};

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];
const SHORT_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Turn a Date into YYYY-MM-DD using the local timezone (avoids UTC shifting the day)
function toIso(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

// Build the first day of the month shown in the calendar
function monthStartFromValue(value: string): Date {
  if (!value) {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }
  const [year, month] = value.split("-").map(Number);
  return new Date(year, month - 1, 1);
}

// Show a short date on the closed field, e.g. 28 Sep 2026
function formatDisplay(value: string): string {
  if (!value) {
    return "";
  }
  const [year, month, day] = value.split("-");
  const monthName = SHORT_MONTHS[Number(month) - 1] ?? month;
  return `${Number(day)} ${monthName} ${year}`;
}

// Neumorphic due-date calendar (native date popups cannot be styled)
export default function DueDatePicker({ value, onChange, className }: DueDatePickerProps) {
  const [open, setOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState(() => monthStartFromValue(value));
  const wrapRef = useRef<HTMLDivElement>(null);

  // Close the calendar on outside click or Escape
  useEffect(() => {
    if (!open) {
      return;
    }
    function handlePointer(event: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstWeekday = new Date(year, month, 1).getDay();
  const today = toIso(new Date());

  // Pick a day, save YYYY-MM-DD, and close the popup
  function selectDay(day: number) {
    onChange(toIso(new Date(year, month, day)));
    setOpen(false);
  }

  return (
    <div className={styles.wrap} ref={wrapRef}>
      <button
        type="button"
        className={`${styles.trigger} ${className}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={value ? `Due date ${formatDisplay(value)}` : "Due date"}
        onClick={() => {
          if (!open) {
            setViewMonth(monthStartFromValue(value));
          }
          setOpen(!open);
        }}
      >
        <span className={value ? undefined : styles.placeholder}>
          {value ? formatDisplay(value) : "dd / mm / yyyy"}
        </span>
        <Calendar className={styles.icon} aria-hidden="true" />
      </button>
      {open ? (
        <div className={styles.panel} role="dialog" aria-label="Choose due date">
          <div className={styles.header}>
            <button
              type="button"
              className={styles.nav}
              aria-label="Previous month"
              onClick={() => setViewMonth(new Date(year, month - 1, 1))}
            >
              <ChevronLeft className={styles.icon} aria-hidden="true" />
            </button>
            <p className={styles.monthLabel}>
              {MONTHS[month]} {year}
            </p>
            <button
              type="button"
              className={styles.nav}
              aria-label="Next month"
              onClick={() => setViewMonth(new Date(year, month + 1, 1))}
            >
              <ChevronRight className={styles.icon} aria-hidden="true" />
            </button>
          </div>
          <div className={styles.weekdays}>
            {WEEKDAYS.map((label, index) => (
              <span key={`${label}-${index}`} className={styles.weekday}>
                {label}
              </span>
            ))}
          </div>
          <div className={styles.grid}>
            {Array.from({ length: firstWeekday }, (_, index) => (
              <span key={`blank-${index}`} className={styles.blank} />
            ))}
            {Array.from({ length: daysInMonth }, (_, index) => {
              const day = index + 1;
              const iso = toIso(new Date(year, month, day));
              const selected = iso === value;
              const isToday = iso === today;
              return (
                <button
                  key={iso}
                  type="button"
                  className={`${styles.day} ${selected ? styles.selected : ""} ${isToday ? styles.today : ""}`}
                  aria-pressed={selected}
                  onClick={() => selectDay(day)}
                >
                  {day}
                </button>
              );
            })}
          </div>
          <div className={styles.footer}>
            <button type="button" className={styles.footerBtn} onClick={() => { onChange(""); setOpen(false); }}>
              Clear
            </button>
            <button
              type="button"
              className={styles.footerBtn}
              onClick={() => {
                const now = new Date();
                onChange(toIso(now));
                setViewMonth(new Date(now.getFullYear(), now.getMonth(), 1));
                setOpen(false);
              }}
            >
              Today
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
