import { NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase/server";

/**
 * GET /api/admin/conversations
 * - Lista: ?days=1|7|30 (default 30) & transferred=true (solo con asesor solicitado)
 * - Detalle: ?id=<uuid> → mensajes de esa conversación
 */
export async function GET(req: Request) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const supabase = getSupabaseAdmin();

  // Detalle: mensajes de una conversación
  if (id) {
    const { data, error } = await supabase
      .from("wa_messages")
      .select("role, content, button_payload, created_at")
      .eq("conversation_id", id)
      .order("created_at", { ascending: true })
      .limit(500);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(data);
  }

  // Lista de conversaciones
  const daysParam = parseInt(searchParams.get("days") || "30", 10);
  const days = [1, 7, 30].includes(daysParam) ? daysParam : 30;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const transferredOnly = searchParams.get("transferred") === "true";

  let query = supabase
    .from("wa_conversations")
    .select("*, wa_messages(count)")
    .gte("last_message_at", since)
    .order("last_message_at", { ascending: false })
    .limit(200);

  if (transferredOnly) {
    query = query.not("transferred_at", "is", null);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
