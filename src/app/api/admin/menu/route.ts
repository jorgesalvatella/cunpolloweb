import { NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export async function GET() {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();

  const [itemsResult, categoriesResult] = await Promise.all([
    supabase
      .from("menu_items")
      .select("*")
      .order("sort_order", { ascending: true }),
    supabase
      .from("categories")
      .select("*")
      .order("sort_order", { ascending: true }),
  ]);

  if (itemsResult.error) {
    return NextResponse.json(
      { error: "Error al obtener items del menu" },
      { status: 500 }
    );
  }

  if (categoriesResult.error) {
    return NextResponse.json(
      { error: "Error al obtener categorias" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    items: itemsResult.data,
    categories: categoriesResult.data,
  });
}

export async function POST(request: Request) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await request.json();

  if (!body.id || !body.name_es || !body.category_id || body.price == null) {
    return NextResponse.json(
      { error: "Campos requeridos: id, name_es, category_id, price" },
      { status: 400 }
    );
  }

  // Validate id format (slug)
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(body.id)) {
    return NextResponse.json(
      { error: "ID debe ser slug (letras minusculas, numeros, guiones)" },
      { status: 400 }
    );
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("menu_items")
    .insert({
      id: body.id,
      category_id: body.category_id,
      name_es: body.name_es,
      name_en: body.name_en || body.name_es,
      description_es: body.description_es || "",
      description_en: body.description_en || "",
      price: body.price,
      image: body.image || "/logo.png",
      tags: body.tags || [],
      available: body.available ?? true,
      is_promo: body.is_promo ?? false,
      sort_order: body.sort_order ?? 99,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Ya existe un producto con ese ID" }, { status: 409 });
    }
    return NextResponse.json({ error: "Error al crear item" }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
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
  const { error } = await supabase.from("menu_items").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: "Error al eliminar item" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function PUT(request: Request) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await request.json();
  const { id, ...fields } = body;

  if (!id) {
    return NextResponse.json(
      { error: "ID del item es requerido" },
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
    .from("menu_items")
    .update(fields)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Error al actualizar item del menu" },
      { status: 500 }
    );
  }

  return NextResponse.json(data);
}
