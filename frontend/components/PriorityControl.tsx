"use client";

import type { Priority } from "@/lib/api";
import styles from "./PriorityControl.module.css";

type PriorityControlProps = {
  value: Priority;
  onChange: (priority: Priority) => void;
};

const OPTIONS: { id: Priority; label: string }[] = [
  { id: "low", label: "Low" },
  { id: "medium", label: "Medium" },
  { id: "high", label: "High" },
];

// Raised / pressed Low–Medium–High switch used on the add and edit form
export default function PriorityControl({ value, onChange }: PriorityControlProps) {
  return (
    <div
      className={styles.track}
      role="radiogroup"
      aria-label="Priority"
      data-selected={value}
    >
      <span className={styles.thumb} aria-hidden="true" />
      {OPTIONS.map((option) => {
        const selected = value === option.id;
        return (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={selected}
            data-priority={option.id}
            className={selected ? `${styles.option} ${styles.selected}` : styles.option}
            onClick={() => onChange(option.id)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
