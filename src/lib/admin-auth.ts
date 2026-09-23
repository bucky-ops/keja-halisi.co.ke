// KEJA HALISI — Admin auth: shared-PIN gate for the moderation console.
//
// The admin console (verification queue, reports, audit, cron triggers) is the
// only privileged surface in the app, and it is deliberately lightweight:
//   • No user accounts / NextAuth — the console is staff-only and demo-grade.
//   • A shared PIN (env ADMIN_PIN, default "keja254" for the public demo) is
//     required by every /api/admin/* and /api/cron/* mutation route.
//   • The browser keeps the PIN in sessionStorage (kh_admin_pin) and sends it
//     in the `x-admin-pin` header on every admin API call (see api.ts).
//   • A wrong/missing PIN returns 401 { error: "Admin authentication required" }.
// Rotate the real PIN in production by setting ADMIN_PIN in the host env.
import { NextRequest } from "next/server";

export const ADMIN_PIN_FALLBACK = "keja254"; // public demo PIN — change via ADMIN_PIN env

export function adminPin(): string {
  return process.env.ADMIN_PIN || ADMIN_PIN_FALLBACK;
}

/** Check an incoming request carries the correct admin PIN header. */
export function isAdminRequest(req: NextRequest): boolean {
  const provided = req.headers.get("x-admin-pin") ?? "";
  return provided.length > 0 && provided === adminPin();
}

/** Wrap a handler: return 401 JSON unless the admin PIN header matches. */
export function requireAdmin<T>(req: NextRequest, handler: () => Promise<T>): Promise<T | Response> {
  if (!isAdminRequest(req)) {
    return Promise.resolve(
      new Response(JSON.stringify({ error: "Admin authentication required" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }),
    );
  }
  return handler();
}
