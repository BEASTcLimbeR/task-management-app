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
    <main className="page-gutter mx-auto w-full min-w-0 max-w-[420px] py-8">
      <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 w-full sm:flex-1">
          <h1 className="text-2xl font-bold leading-snug break-words text-slate-900 dark:text-slate-100">
            Task Manager App
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Sign in to continue
          </p>
        </div>
        <div className="flex shrink-0 items-center self-end sm:self-start">
          <ThemeToggle />
        </div>
      </header>
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-6">
        <LoginForm nextPath={nextPath} />
      </section>
    </main>
  );
}
