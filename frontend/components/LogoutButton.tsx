"use client";

import { LogOut } from "lucide-react";
import { logoutAction } from "@/app/actions/auth";

// Header control that clears the session cookie and returns to /login
export default function LogoutButton() {
  return (
    <form action={logoutAction}>
      <button
        type="submit"
        aria-label="Log out"
        className="inline-flex h-8 items-center gap-1 rounded-lg px-2 text-sm text-slate-600 hover:bg-slate-200/80 focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:outline-none dark:text-slate-300 dark:hover:bg-slate-800 dark:focus-visible:ring-sky-400"
      >
        <LogOut className="h-4 w-4" aria-hidden="true" />
        <span className="hidden sm:inline">Log out</span>
      </button>
    </form>
  );
}
