import { NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase/server";
import { refundCharge } from "@/lib/openpay";
import { logAdminAction } from "@/lib/audit-log";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;

  if (!UUID_REGEX.test(id)) {
    return NextResponse.json({ error: "ID invalido" }, { status: 400 });
  }

  // Get order
  const { data: order, error: dbError } = await supabaseAdmin
    .from("orders")
    .select("id, order_number, status, payment_status, payment_reference, total")
    .eq("id", id)
    .single();

  if (dbError || !order) {
    return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
  }

  // Only refund paid orders
  if (order.payment_status !== "success") {
    return NextResponse.json(
      { error: "Solo se pueden reembolsar pedidos con pago exitoso" },
      { status: 400 }
    );
  }

  if (!order.payment_reference) {
    return NextResponse.json(
      { error: "No se encontro referencia de pago para reembolsar" },
      { status: 400 }
    );
  }

  // Process refund with Openpay
  const result = await refundCharge(
    order.payment_reference,
    `Reembolso pedido #${order.order_number}`
  );

  if (!result.success) {
    return NextResponse.json(
      { error: result.error || "Error al procesar el reembolso" },
      { status: 500 }
    );
  }

  // Update order status
  await supabaseAdmin
    .from("orders")
    .update({
      payment_status: "refunded",
      status: "cancelled",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  // Audit log
  logAdminAction({
    action: "refund",
    entityType: "order",
    entityId: id,
    oldValue: { payment_status: order.payment_status, status: order.status },
    newValue: { payment_status: "refunded", status: "cancelled", refundId: result.refundId },
  });

  return NextResponse.json({
    success: true,
    refundId: result.refundId,
    orderNumber: order.order_number,
  });
}
