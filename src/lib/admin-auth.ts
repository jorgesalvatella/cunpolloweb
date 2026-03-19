import { cookies } from "next/headers";
import crypto from "crypto";

const COOKIE_NAME = "cunpollo-admin";

export type AdminRole = "admin" | "cocina" | "entrega" | "gerente";

interface AdminUser {
  username: string;
  password: string;
  role: AdminRole;
}

const VALID_ROLES: AdminRole[] = ["admin", "cocina", "entrega", "gerente"];

function getAdminUsers(): AdminUser[] {
  const usersStr = process.env.ADMIN_USERS || "";

  if (usersStr) {
    return usersStr
      .split(",")
      .map((entry) => {
        const [username, password, role] = entry.trim().split(":");
        return { username, password, role: role as AdminRole };
      })
      .filter((u) => u.username && u.password && VALID_ROLES.includes(u.role));
  }

  // Backward compatibility: ADMIN_PASSWORD as admin role
  const pwd = process.env.ADMIN_PASSWORD || "";
  if (pwd) return [{ username: "admin", password: pwd, role: "admin" }];
  return [];
}

function hashCredentials(username: string, password: string): string {
  const salt = process.env.ADMIN_COOKIE_SECRET || "cunpollo-admin-salt";
  return crypto
    .createHmac("sha256", salt)
    .update(`${username}:${password}`)
    .digest("hex");
}

export async function verifyAdmin(): Promise<boolean> {
  const role = await getAdminRole();
  return role !== null;
}

export async function getAdminRole(): Promise<AdminRole | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const users = getAdminUsers();
  for (const user of users) {
    const expected = hashCredentials(user.username, user.password);
    if (expected.length === token.length) {
      if (crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected))) {
        return user.role;
      }
    }
  }

  return null;
}

export function validateCredentials(
  username: string,
  password: string
): AdminUser | null {
  const users = getAdminUsers();
  for (const user of users) {
    if (user.username === username) {
      const a = Buffer.from(password);
      const b = Buffer.from(user.password);
      if (a.length === b.length && crypto.timingSafeEqual(a, b)) {
        return user;
      }
    }
  }
  return null;
}

const ALLOWED_ORIGINS = [
  "https://cunpollo.com",
  "https://www.cunpollo.com",
  "https://cunpolloweb.vercel.app",
];

export function verifyCsrfOrigin(request: Request): boolean {
  // In development, skip check
  if (process.env.NODE_ENV !== "production") return true;

  const origin = request.headers.get("origin");
  // No origin header (e.g., same-origin requests from some browsers) — allow
  if (!origin) return true;

  return ALLOWED_ORIGINS.some((allowed) => origin === allowed);
}

export function getAdminCookieName(): string {
  return COOKIE_NAME;
}

export function getAdminCookieValue(
  username: string,
  password: string
): string {
  return hashCredentials(username, password);
}
