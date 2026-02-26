import { NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const { status } = await request.json();

  const validStatuses = ["pending", "paid", "preparing", "ready", "picked_up", "cancelled"];
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("orders")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: "Error al actualizar" }, { status: 500 });
  }

  return NextResponse.json(data);
}
