import { NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export async function GET() {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("admin_phones")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: "Error al obtener telefonos" }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await request.json();
  const { name, phone } = body;

  if (!name || !phone) {
    return NextResponse.json({ error: "Nombre y telefono requeridos" }, { status: 400 });
  }

  // Normalize phone: strip spaces, dashes, parens
  const cleaned = phone.replace(/[\s\-()]/g, "");

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("admin_phones")
    .insert({ name, phone: cleaned })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Este telefono ya existe" }, { status: 409 });
    }
    return NextResponse.json({ error: "Error al crear telefono" }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

export async function PUT(request: Request) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await request.json();
  const { id, ...fields } = body;

  if (!id) {
    return NextResponse.json({ error: "ID requerido" }, { status: 400 });
  }

  // Only allow updating name, phone, active
  const allowed: Record<string, unknown> = {};
  if (fields.name !== undefined) allowed.name = fields.name;
  if (fields.phone !== undefined) allowed.phone = fields.phone.replace(/[\s\-()]/g, "");
  if (fields.active !== undefined) allowed.active = fields.active;

  if (Object.keys(allowed).length === 0) {
    return NextResponse.json({ error: "Nada que actualizar" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("admin_phones")
    .update(allowed)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Este telefono ya existe" }, { status: 409 });
    }
    return NextResponse.json({ error: "Error al actualizar" }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(request: Request) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "ID requerido" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("admin_phones")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: "Error al eliminar" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
