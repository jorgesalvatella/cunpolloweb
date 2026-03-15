import { NextResponse } from "next/server";
import { validateCredentials, getAdminCookieName, getAdminCookieValue } from "@/lib/admin-auth";

export async function POST(request: Request) {
  const { username, password } = await request.json();

  const user = validateCredentials(username || "", password || "");
  if (!user) {
    return NextResponse.json({ error: "Credenciales incorrectas" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true, role: user.role });
  response.cookies.set(getAdminCookieName(), getAdminCookieValue(user.username, user.password), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24, // 24 hours
  });

  return response;
}
