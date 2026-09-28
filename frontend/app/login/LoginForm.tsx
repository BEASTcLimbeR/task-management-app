"use client";

import { useActionState, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { loginAction, type LoginState } from "@/app/actions/auth";

const fieldClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none ring-sky-500 focus-visible:ring-2 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 dark:ring-sky-400";

type LoginFormProps = {
  nextPath: string;
};

// Username and password form that calls the login Server Action
export default function LoginForm({ nextPath }: LoginFormProps) {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(
    loginAction,
    null,
  );
  const [showPassword, setShowPassword] = useState(false);
  const [cooling, setCooling] = useState(false);

  // Pause the button after submit so a failed attempt cannot be spammed
  function handleSubmit() {
    setCooling(true);
    window.setTimeout(() => setCooling(false), 1000);
  }

  return (
    <form action={formAction} onSubmit={handleSubmit} className="space-y-3">
      <input type="hidden" name="next" value={nextPath} />
      <label className="block">
        <span className="mb-1 block text-sm text-slate-600 dark:text-slate-300">Username</span>
        <input
          id="login-username"
          name="username"
          type="text"
          autoComplete="username"
          required
          className={fieldClass}
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm text-slate-600 dark:text-slate-300">Password</span>
        <span className="relative block">
          <input
            id="login-password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            required
            className={`${fieldClass} pr-10`}
          />
          <button
            type="button"
            onClick={() => setShowPassword((open) => !open)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute top-1/2 right-2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-200/80 focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:outline-none dark:text-slate-300 dark:hover:bg-slate-800 dark:focus-visible:ring-sky-400"
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Eye className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        </span>
      </label>
      {state?.error ? (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {state.error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending || cooling}
        className="rounded-lg bg-sky-700 px-4 py-2 text-sm font-medium text-white hover:bg-sky-800 focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60 dark:bg-sky-600 dark:hover:bg-sky-500 dark:focus-visible:ring-sky-400"
      >
        {pending ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
