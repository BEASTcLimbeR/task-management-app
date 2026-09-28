import { Suspense } from "react";
import HomePage from "@/components/HomePage";
import { isAuthGateEnabled } from "@/lib/auth";

// Placeholder shown while the client URL state (useSearchParams) is ready
function HomeFallback() {
  return (
    <main className="mx-auto w-full max-w-[720px] px-4 py-8">
      <p className="text-sm text-slate-500 dark:text-slate-400">Loading tasks...</p>
    </main>
  );
}

// Server page wraps the client home in Suspense so the build can prerender the shell
export default function Page() {
  return (
    <Suspense fallback={<HomeFallback />}>
      <HomePage showLogout={isAuthGateEnabled()} />
    </Suspense>
  );
}
