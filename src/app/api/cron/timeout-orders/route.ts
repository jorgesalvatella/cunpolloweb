import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getCharge } from "@/lib/openpay";

/**
 * Checks for orders stuck in "processing" or "pending_3ds" for more than 30 minutes.
 * For each, verifies with Openpay and updates accordingly.
 *
 * Can be triggered via Vercel Cron or manually:
 * - Vercel Cron: add to vercel.json
 * - Manual: GET /api/cron/timeout-orders?token=<CRON_SECRET>
 */
export async function GET(request: Request) {
  // Verify cron secret
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const url = new URL(request.url);
    const token = url.searchParams.get("token");
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${cronSecret}` && token !== cronSecret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const thirtyMinAgo = new Date(Date.now() - 30 * 60_000).toISOString();

  // Find stuck orders
  const { data: stuckOrders, error } = await supabaseAdmin
    .from("orders")
    .select("id, payment_status, payment_reference, order_number")
    .in("payment_status", ["processing", "pending_3ds"])
    .lt("created_at", thirtyMinAgo);

  if (error || !stuckOrders) {
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }

  const results: { id: string; order_number: number; action: string }[] = [];

  for (const order of stuckOrders) {
    if (order.payment_reference) {
      // Verify with Openpay
      const charge = await getCharge(order.payment_reference);

      if (charge.status === "completed") {
        await supabaseAdmin
          .from("orders")
          .update({ payment_status: "success", status: "paid" })
          .eq("id", order.id);

        // Notify via WhatsApp
        try {
          const fullOrder = await supabaseAdmin
            .from("orders")
            .select("*")
            .eq("id", order.id)
            .single();
          if (fullOrder.data) {
            const { notifyAdminNewOrder, notifyCustomerStatusChange } = await import("@/lib/twilio");
            notifyAdminNewOrder(fullOrder.data);
            notifyCustomerStatusChange(fullOrder.data);
          }
        } catch {}

        results.push({ id: order.id, order_number: order.order_number, action: "marked_paid" });
      } else if (charge.status === "failed") {
        await supabaseAdmin
          .from("orders")
          .update({ payment_status: "failed", status: "cancelled" })
          .eq("id", order.id);
        results.push({ id: order.id, order_number: order.order_number, action: "marked_failed" });
      } else {
        // Still pending after 30 min — mark as timeout
        await supabaseAdmin
          .from("orders")
          .update({ payment_status: "failed", status: "cancelled" })
          .eq("id", order.id);
        results.push({ id: order.id, order_number: order.order_number, action: "timeout_cancelled" });
      }
    } else {
      // No payment reference — mark as timeout
      await supabaseAdmin
        .from("orders")
        .update({ payment_status: "failed", status: "cancelled" })
        .eq("id", order.id);
      results.push({ id: order.id, order_number: order.order_number, action: "timeout_no_ref" });
    }
  }

  console.log(`[Cron] Processed ${results.length} stuck orders:`, results);

  return NextResponse.json({
    processed: results.length,
    results,
  });
}
