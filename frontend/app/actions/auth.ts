"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  createSessionToken,
  getSessionCookieName,
  getSessionCookieOptions,
  isAuthGateEnabled,
  safeNextPath,
  timingSafeEqual,
} from "@/lib/auth";

export type LoginState = { error: string; at: number } | null;

// Check username and password, then set the signed session cookie
export async function loginAction(
  _prev: LoginState,
  formData: FormData,
): Promise<LoginState> {
  if (!isAuthGateEnabled()) {
    redirect("/");
  }

  const username = String(formData.get("username") ?? "");
  const password = String(formData.get("password") ?? "");
  const nextPath = safeNextPath(formData.get("next"));

  const expectedUser = process.env.AUTH_USERNAME ?? "";
  const expectedPass = process.env.AUTH_PASSWORD ?? "";
  const userOk = timingSafeEqual(username, expectedUser);
  const passOk = timingSafeEqual(password, expectedPass);

  if (!userOk || !passOk) {
    return { error: "Incorrect username or password", at: Date.now() };
  }

  const token = await createSessionToken();
  if (!token) {
    return { error: "Incorrect username or password", at: Date.now() };
  }

  const cookieStore = await cookies();
  cookieStore.set(getSessionCookieName(), token, getSessionCookieOptions());
  // One-time flag so the home page can show the preloader after this login
  const dest = new URL(nextPath, "http://local.invalid");
  dest.searchParams.set("welcome", "1");
  redirect(`${dest.pathname}${dest.search}`);
}

// Clear the session cookie and send the user back to the login page
export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.set(getSessionCookieName(), "", {
    ...getSessionCookieOptions(),
    maxAge: 0,
  });
  if (isAuthGateEnabled()) {
    redirect("/login");
  }
  redirect("/");
}
