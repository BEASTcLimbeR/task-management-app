"use client";

import type { RefObject } from "react";
import type { SortKey } from "@/lib/view";

type SearchSortBarProps = {
  query: string;
  sort: SortKey;
  searchRef: RefObject<HTMLInputElement | null>;
  onQueryChange: (value: string) => void;
  onSortChange: (value: SortKey) => void;
};

const fieldClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-sky-500 focus-visible:ring-2 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:ring-sky-400";

// Search box and sort dropdown; both stay in the URL so a refresh keeps the same view
export default function SearchSortBar({
  query,
  sort,
  searchRef,
  onQueryChange,
  onSortChange,
}: SearchSortBarProps) {
  return (
    <div className="mt-4 flex min-w-0 flex-col gap-3 sm:flex-row">
      <label className="relative min-w-0 flex-1">
        <span className="sr-only">Search tasks</span>
        <input
          ref={searchRef}
          id="task-search"
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Search title or description"
          autoComplete="off"
          className={fieldClass}
        />
      </label>
      <label className="sm:w-48">
        <span className="sr-only">Sort tasks</span>
        <select
          value={sort}
          onChange={(event) => onSortChange(event.target.value as SortKey)}
          className={fieldClass}
        >
          <option value="due">Due date</option>
          <option value="priority">Priority</option>
          <option value="newest">Newest</option>
        </select>
      </label>
    </div>
  );
}
