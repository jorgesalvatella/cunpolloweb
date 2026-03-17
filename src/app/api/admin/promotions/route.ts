import { NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export async function GET() {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("promotions")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: "Error al obtener promociones" },
      { status: 500 }
    );
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await request.json();
  const { name, description_es, description_en, discount_type, discount_value, target_order_type } = body;

  if (!name || !discount_type || discount_value === undefined || !target_order_type) {
    return NextResponse.json(
      { error: "name, discount_type, discount_value y target_order_type son requeridos" },
      { status: 400 }
    );
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("promotions")
    .insert({
      name,
      description_es: description_es || null,
      description_en: description_en || null,
      discount_type,
      discount_value,
      target_order_type,
      min_order_amount: body.min_order_amount || null,
      active: body.active ?? true,
      starts_at: body.starts_at || null,
      ends_at: body.ends_at || null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Error al crear promocion" },
      { status: 500 }
    );
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
    return NextResponse.json(
      { error: "ID de la promocion es requerido" },
      { status: 400 }
    );
  }

  if (Object.keys(fields).length === 0) {
    return NextResponse.json(
      { error: "No se proporcionaron campos para actualizar" },
      { status: 400 }
    );
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("promotions")
    .update(fields)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Error al actualizar promocion" },
      { status: 500 }
    );
  }

  return NextResponse.json(data);
}
