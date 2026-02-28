import { cookies } from "next/headers";
import crypto from "crypto";

const COOKIE_NAME = "cunpollo-admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "";

export async function verifyAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token || !ADMIN_PASSWORD) return false;
  return token === hashPassword(ADMIN_PASSWORD);
}

export function validatePassword(password: string): boolean {
  if (!ADMIN_PASSWORD) return false;
  // Constant-time comparison to prevent timing attacks
  const a = Buffer.from(password);
  const b = Buffer.from(ADMIN_PASSWORD);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export function hashPassword(password: string): string {
  return crypto.createHmac("sha256", "cunpollo-admin-salt").update(password).digest("hex");
}

export function getAdminCookieName(): string {
  return COOKIE_NAME;
}

export function getAdminCookieValue(): string {
  return hashPassword(ADMIN_PASSWORD);
}
