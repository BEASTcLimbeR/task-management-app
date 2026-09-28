import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import ThemeToggle from "@/components/ThemeToggle";
import {
  getSessionCookieName,
  isAuthGateEnabled,
  isValidSessionToken,
  safeNextPath,
} from "@/lib/auth";
import LoginForm from "./LoginForm";

export const metadata: Metadata = {
  title: "Sign in · Task Manager App",
};

// Login screen; skipped entirely when AUTH_USERNAME / AUTH_PASSWORD are unset
export default async function LoginPage({
  searchParams,
}: PageProps<"/login">) {
  const params = await searchParams;
  const nextPath = safeNextPath(params.next);

  if (!isAuthGateEnabled()) {
    redirect("/");
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(getSessionCookieName())?.value;
  if (await isValidSessionToken(token)) {
    redirect(nextPath);
  }

  return (
    <main className="mx-auto w-full min-w-0 max-w-[420px] px-4 py-8 pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))]">
      <header className="mb-6 flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold leading-snug break-words text-slate-900 sm:text-2xl dark:text-slate-100">
            Task Manager App
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Sign in to continue
          </p>
        </div>
        <div className="flex shrink-0 items-center">
          <ThemeToggle />
        </div>
      </header>
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-6">
        <LoginForm nextPath={nextPath} />
      </section>
    </main>
  );
}
