import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  getSessionCookieName,
  isAuthGateEnabled,
  isValidSessionToken,
} from "@/lib/auth";

// Send people to /login when the gate is on and they have no valid session
export async function proxy(request: NextRequest) {
  if (!isAuthGateEnabled()) {
    return NextResponse.next();
  }

  const token = request.cookies.get(getSessionCookieName())?.value;
  if (await isValidSessionToken(token)) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/login", request.url);
  const nextPath = request.nextUrl.pathname + request.nextUrl.search;
  if (nextPath && nextPath !== "/") {
    loginUrl.searchParams.set("next", nextPath);
  }
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/", "/docs", "/docs/:path*"],
};
