import { cookies } from "next/headers";

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
  return password === ADMIN_PASSWORD;
}

export function hashPassword(password: string): string {
  // Simple hash for cookie value - not cryptographic, just to avoid storing plain password in cookie
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return `admin_${Math.abs(hash).toString(36)}`;
}

export function getAdminCookieName(): string {
  return COOKIE_NAME;
}

export function getAdminCookieValue(): string {
  return hashPassword(ADMIN_PASSWORD);
}
