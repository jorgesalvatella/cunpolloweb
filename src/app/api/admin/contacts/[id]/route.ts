import { NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;
  const supabase = getSupabaseAdmin();

  const { error } = await supabase
    .from("contacts")
    .update({ active: false })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: "Error al desactivar contacto" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
