import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getMenuItemById } from "@/data";
import { createCharge } from "@/lib/openpay";
import type { CreateOrderRequest, OrderItem } from "@/types/order";

export async function POST(request: Request) {
  try {
    const body: CreateOrderRequest = await request.json();

    // Validate required fields
    if (
      !body.items?.length ||
      !body.customerName ||
      !body.customerPhone ||
      !body.tokenId ||
      !body.deviceSessionId
    ) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }

    // Validate customer input
    const name = String(body.customerName).trim();
    const phone = String(body.customerPhone).replace(/[\s\-()]/g, "");
    if (name.length < 2 || name.length > 100) {
      return NextResponse.json({ error: "Nombre debe tener 2-100 caracteres" }, { status: 400 });
    }
    if (!/^\+?[0-9]{10,15}$/.test(phone)) {
      return NextResponse.json({ error: "Telefono invalido" }, { status: 400 });
    }

    // Limit total items per order
    if (body.items.length > 50) {
      return NextResponse.json({ error: "Demasiados productos en el pedido" }, { status: 400 });
    }

    // Validate items and recalculate prices server-side
    const orderItems: OrderItem[] = [];
    for (const item of body.items) {
      if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 100) {
        return NextResponse.json({ error: "Cantidad invalida (1-100)" }, { status: 400 });
      }

      const menuItem = getMenuItemById(item.menuItemId);
      if (!menuItem || !menuItem.available) {
        return NextResponse.json(
          { error: "Uno o mas productos no estan disponibles" },
          { status: 400 }
        );
      }
      orderItems.push({
        menuItemId: item.menuItemId,
        name: menuItem.name.es,
        quantity: item.quantity,
        unitPrice: menuItem.price,
        lineTotal: menuItem.price * item.quantity,
      });
    }

    const subtotal = orderItems.reduce((sum, i) => sum + i.lineTotal, 0);
    const total = subtotal;

    // Create order in Supabase (status: pending)
    const { data: order, error: dbError } = await supabaseAdmin
      .from("orders")
      .insert({
        customer_name: name,
        customer_phone: phone,
        items: orderItems,
        subtotal,
        total,
        status: "pending",
        payment_status: "processing",
      })
      .select("id, order_number")
      .single();

    if (dbError || !order) {
      console.error("DB error:", dbError);
      return NextResponse.json({ error: "Error al crear el pedido" }, { status: 500 });
    }

    // Process payment with OpenPay
    const itemNames = orderItems.map((i) => `${i.name} x${i.quantity}`).join(", ");
    const chargeResult = await createCharge({
      tokenId: body.tokenId,
      deviceSessionId: body.deviceSessionId,
      amount: total,
      description: `CUNPOLLO Pedido #${order.order_number}: ${itemNames}`.slice(0, 250),
      orderId: order.id,
      customerName: name,
    });

    if (!chargeResult.success) {
      // Update order as failed
      await supabaseAdmin
        .from("orders")
        .update({ payment_status: "failed", status: "cancelled" })
        .eq("id", order.id);

      return NextResponse.json(
        { error: chargeResult.error || "Error al procesar el pago" },
        { status: 402 }
      );
    }

    // Payment successful — update order
    await supabaseAdmin
      .from("orders")
      .update({
        payment_status: "success",
        payment_reference: chargeResult.chargeId,
        status: "paid",
      })
      .eq("id", order.id);

    // Fire-and-forget WhatsApp notification
    try {
      const { notifyAdminNewOrder } = await import("@/lib/twilio");
      notifyAdminNewOrder({
        id: order.id,
        order_number: order.order_number,
        customer_name: name,
        customer_phone: phone,
        items: orderItems,
        subtotal,
        total,
        status: "paid",
        payment_status: "success",
        payment_reference: chargeResult.chargeId || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    } catch {}

    return NextResponse.json({
      orderId: order.id,
      orderNumber: order.order_number,
    });
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
