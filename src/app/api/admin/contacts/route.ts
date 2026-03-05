import { NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase/server";

export async function GET(request: Request) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const active = searchParams.get("active");

  const supabase = getSupabaseAdmin();
  let query = supabase
    .from("contacts")
    .select("*")
    .order("created_at", { ascending: false });

  if (active === "true") {
    query = query.eq("active", true);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: "Error al obtener contactos" }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await request.json();
  const supabase = getSupabaseAdmin();

  // Import contacts from orders
  if (body.importFromOrders) {
    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select("customer_name, customer_phone")
      .not("customer_phone", "is", null);

    if (ordersError) {
      return NextResponse.json({ error: "Error al obtener pedidos" }, { status: 500 });
    }

    // Deduplicate by phone
    const uniquePhones = new Map<string, string>();
    for (const order of orders || []) {
      if (order.customer_phone && !uniquePhones.has(order.customer_phone)) {
        uniquePhones.set(order.customer_phone, order.customer_name || "Cliente");
      }
    }

    const contacts = Array.from(uniquePhones.entries()).map(([phone, name]) => ({
      name,
      phone,
      source: "order" as const,
    }));

    if (contacts.length === 0) {
      return NextResponse.json({ imported: 0 });
    }

    const { error: insertError } = await supabase
      .from("contacts")
      .upsert(contacts, { onConflict: "phone", ignoreDuplicates: true });

    if (insertError) {
      return NextResponse.json({ error: "Error al importar contactos" }, { status: 500 });
    }

    return NextResponse.json({ imported: contacts.length });
  }

  // Add single contact
  const { name, phone } = body;
  if (!name || !phone) {
    return NextResponse.json({ error: "Nombre y telefono requeridos" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("contacts")
    .insert({ name, phone })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Este telefono ya existe" }, { status: 409 });
    }
    return NextResponse.json({ error: "Error al crear contacto" }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
