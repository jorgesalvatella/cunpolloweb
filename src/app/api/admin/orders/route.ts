import { NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function GET(request: Request) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  let query = supabaseAdmin
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  if (status) {
    query = query.eq("status", status);
  }

  const { data: orders, error } = await query;

  if (error) {
    return NextResponse.json({ error: "Error al obtener pedidos" }, { status: 500 });
  }

  return NextResponse.json(orders);
}
