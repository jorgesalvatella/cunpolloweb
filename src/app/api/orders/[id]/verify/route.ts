import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getCharge } from "@/lib/openpay";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!UUID_REGEX.test(id)) {
    return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
  }

  const { data: order, error: dbError } = await supabaseAdmin
    .from("orders")
    .select("id, payment_status, payment_reference, status")
    .eq("id", id)
    .single();

  if (dbError || !order) {
    return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
  }

  // Already resolved
  if (order.payment_status === "success") {
    return NextResponse.json({ status: "paid" });
  }

  if (order.payment_status === "failed") {
    return NextResponse.json({ status: "failed" });
  }

  // Verify with Openpay
  if (!order.payment_reference) {
    return NextResponse.json({ status: "unknown" });
  }

  const result = await getCharge(order.payment_reference);

  if (result.error) {
    return NextResponse.json({ status: "error", error: result.error });
  }

  if (result.status === "completed") {
    await supabaseAdmin
      .from("orders")
      .update({ payment_status: "success", status: "paid" })
      .eq("id", id);

    // Fire-and-forget WhatsApp notification
    try {
      const fullOrder = await supabaseAdmin
        .from("orders")
        .select("*")
        .eq("id", id)
        .single();

      if (fullOrder.data) {
        const { notifyAdminNewOrder } = await import("@/lib/twilio");
        notifyAdminNewOrder(fullOrder.data);
      }
    } catch {}

    return NextResponse.json({ status: "paid" });
  }

  if (result.status === "failed") {
    await supabaseAdmin
      .from("orders")
      .update({ payment_status: "failed", status: "cancelled" })
      .eq("id", id);

    return NextResponse.json({ status: "failed" });
  }

  return NextResponse.json({ status: "pending" });
}
