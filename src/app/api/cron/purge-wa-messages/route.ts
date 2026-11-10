import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";

/**
 * Borra mensajes de WhatsApp (wa_messages) con mas de 30 dias.
 * NO borra wa_conversations (conservan registro del cliente y transfer_reason).
 *
 * - Vercel Cron: diario (ver vercel.json)
 * - Manual: GET /api/cron/purge-wa-messages?token=<CRON_SECRET>
 */
export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const url = new URL(request.url);
    const token = url.searchParams.get("token");
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${cronSecret}` && token !== cronSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const supabase = getSupabaseAdmin();
  const { error, count } = await supabase
    .from("wa_messages")
    .delete({ count: "exact" })
    .lt("created_at", cutoff);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  console.log(`[Cron] purge-wa-messages: deleted ${count ?? 0} messages older than 30 days`);

  return NextResponse.json({ ok: true, deleted: count ?? 0 });
}
