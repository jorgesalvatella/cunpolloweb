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
