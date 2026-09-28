"use client";

import type { TaskStatus } from "@/lib/api";
import styles from "./FilterTabs.module.css";

type FilterTabsProps = {
  current: TaskStatus;
  pendingCount: number;
  completedCount: number;
  onChange: (status: TaskStatus) => void;
};

// Switch between All / Pending / Completed and show how many tasks are in each
export default function FilterTabs({
  current,
  pendingCount,
  completedCount,
  onChange,
}: FilterTabsProps) {
  const allCount = pendingCount + completedCount;
  const tabs: { id: TaskStatus; label: string; count: number }[] = [
    { id: "all", label: "All", count: allCount },
    { id: "pending", label: "Pending", count: pendingCount },
    { id: "completed", label: "Completed", count: completedCount },
  ];

  return (
    <div className={styles.list} role="tablist" aria-label="Task filters">
      {tabs.map((tab) => {
        const selected = current === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(tab.id)}
            className={selected ? `${styles.tab} ${styles.selected}` : styles.tab}
          >
            {tab.label} ({tab.count})
          </button>
        );
      })}
    </div>
  );
}
