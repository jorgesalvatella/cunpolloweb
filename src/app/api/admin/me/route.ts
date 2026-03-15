import { NextResponse } from "next/server";
import { getAdminRole } from "@/lib/admin-auth";

export async function GET() {
  const role = await getAdminRole();
  if (!role) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  return NextResponse.json({ role });
}
