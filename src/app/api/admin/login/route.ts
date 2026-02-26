import { NextResponse } from "next/server";
import { validatePassword, getAdminCookieName, getAdminCookieValue } from "@/lib/admin-auth";

export async function POST(request: Request) {
  const { password } = await request.json();

  if (!validatePassword(password)) {
    return NextResponse.json({ error: "Contraseña incorrecta" }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(getAdminCookieName(), getAdminCookieValue(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24, // 24 hours
  });

  return response;
}
