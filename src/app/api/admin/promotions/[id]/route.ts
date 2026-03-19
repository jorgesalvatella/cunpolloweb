import { NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase/server";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;

  if (!id || !UUID_REGEX.test(id)) {
    return NextResponse.json(
      { error: "ID de la promocion invalido" },
      { status: 400 }
    );
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("promotions")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json(
      { error: "Error al eliminar promocion" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
