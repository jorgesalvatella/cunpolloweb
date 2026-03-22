import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getCharge } from "@/lib/openpay";

/**
 * Openpay Webhook — receives charge status notifications.
 * Handles cases where the user completes 3D Secure but never returns
 * to the confirmation page (closes browser, loses internet, etc.).
 *
 * Configure this URL in your Openpay dashboard:
 * https://cunpollo.com/api/webhooks/openpay
 */
export async function POST(request: Request) {
  try {
    // Verify webhook comes from Openpay by checking basic auth or verification token
    const webhookToken = process.env.OPENPAY_WEBHOOK_TOKEN;
    if (webhookToken) {
      const authHeader = request.headers.get("authorization");
      const url = new URL(request.url);
      const token = url.searchParams.get("token");
      if (authHeader !== `Bearer ${webhookToken}` && token !== webhookToken) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const body = await request.json();

    // Handle Openpay webhook verification — echo back the verification_code
    if (body.verification_code) {
      console.log("[Webhook] Verification code received:", body.verification_code);
      return NextResponse.json({ verification_code: body.verification_code });
    }

    // Openpay sends: { type, transaction: { id, status, order_id, ... } }
    const transaction = body.transaction;
    if (!transaction?.order_id) {
      return NextResponse.json({ ok: true, message: "No order_id" });
    }

    const orderId = transaction.order_id;

    // Look up the order
    const { data: order, error: dbError } = await supabaseAdmin
      .from("orders")
      .select("id, status, payment_status, payment_reference")
      .eq("id", orderId)
      .single();

    if (dbError || !order) {
      console.error("[Webhook] Order not found:", orderId);
      return NextResponse.json({ ok: true, message: "Order not found" });
    }

    // Only process if payment is still pending
    if (order.payment_status === "success" || order.payment_status === "failed") {
      return NextResponse.json({ ok: true, message: "Already resolved" });
    }

    console.log(`[Webhook] Processing order ${orderId}, payment_status: ${order.payment_status}, transaction status: ${transaction.status}`);

    // Verify the charge status directly with Openpay (don't trust webhook payload alone)
    const chargeId = order.payment_reference || transaction.id;
    if (!chargeId) {
      return NextResponse.json({ ok: true, message: "No charge ID" });
    }

    const result = await getCharge(chargeId);

    if (result.status === "completed") {
      await supabaseAdmin
        .from("orders")
        .update({
          payment_status: "success",
          status: "paid",
          payment_reference: chargeId,
        })
        .eq("id", orderId);

      // Notify admin via WhatsApp
      try {
        const fullOrder = await supabaseAdmin
          .from("orders")
          .select("*")
          .eq("id", orderId)
          .single();

        if (fullOrder.data) {
          const { notifyAdminNewOrder, notifyCustomerStatusChange } = await import("@/lib/twilio");
          notifyAdminNewOrder(fullOrder.data);
          notifyCustomerStatusChange(fullOrder.data);
        }
      } catch {}

      console.log(`[Webhook] Order ${orderId} marked as paid via webhook`);
    } else if (result.status === "failed") {
      await supabaseAdmin
        .from("orders")
        .update({ payment_status: "failed", status: "cancelled" })
        .eq("id", orderId);

      console.log(`[Webhook] Order ${orderId} marked as failed via webhook`);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[Webhook] Error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

// Openpay may also send GET requests for webhook verification
export async function GET() {
  return NextResponse.json({ ok: true, service: "cunpollo-openpay-webhook" });
}
