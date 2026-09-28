const COOKIE_NAME = "tm_session";
const SESSION_MS = 7 * 24 * 60 * 60 * 1000;

// True when both username and password env vars are set, so the login gate is on
export function isAuthGateEnabled(): boolean {
  const username = process.env.AUTH_USERNAME;
  const password = process.env.AUTH_PASSWORD;
  return Boolean(username && password);
}

// Cookie name used for the signed session
export function getSessionCookieName(): string {
  return COOKIE_NAME;
}

// Cookie flags: httpOnly, 7 days, secure in production, SameSite=Lax
export function getSessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: SESSION_MS / 1000,
  };
}

// Keep only same-origin paths like / or /docs so next= cannot send people away
export function safeNextPath(value: unknown): string {
  if (Array.isArray(value)) {
    return safeNextPath(value[0]);
  }
  if (typeof value !== "string") {
    return "/";
  }
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) {
    return "/";
  }
  if (value.startsWith("/login")) {
    return "/";
  }
  return value;
}

// Compare two strings without returning early on the first different character
export function timingSafeEqual(left: string, right: string): boolean {
  const encoder = new TextEncoder();
  const a = encoder.encode(left);
  const b = encoder.encode(right);
  const len = Math.max(a.length, b.length);
  let mismatch = a.length === b.length ? 0 : 1;
  for (let i = 0; i < len; i++) {
    const av = i < a.length ? a[i] : 0;
    const bv = i < b.length ? b[i] : 0;
    mismatch |= av ^ bv;
  }
  return mismatch === 0;
}

// HMAC-SHA256 hex digest of a message, using AUTH_SECRET as the key
async function hmacHex(secret: string, message: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

// Build a signed session value that expires in 7 days
export async function createSessionToken(): Promise<string | null> {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    return null;
  }
  const expiry = String(Date.now() + SESSION_MS);
  const signature = await hmacHex(secret, `v1.${expiry}`);
  return `v1.${expiry}.${signature}`;
}

// Check that a cookie value is a valid, unexpired HMAC session
export async function isValidSessionToken(token: string | undefined): Promise<boolean> {
  const secret = process.env.AUTH_SECRET;
  if (!secret || !token) {
    return false;
  }
  const parts = token.split(".");
  if (parts.length !== 3 || parts[0] !== "v1") {
    return false;
  }
  const expiry = Number(parts[1]);
  if (!Number.isFinite(expiry) || expiry < Date.now()) {
    return false;
  }
  const expected = await hmacHex(secret, `v1.${parts[1]}`);
  return timingSafeEqual(parts[2], expected);
}
