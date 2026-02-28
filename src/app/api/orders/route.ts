import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { tokenizeCard, createCharge } from "@/lib/t1pagos";
import { notifyCustomerStatusChange, notifyAdminNewOrder } from "@/lib/twilio";
import { getMenuItemById } from "@/data";
import type { CreateOrderRequest, OrderItem } from "@/types/order";

export async function POST(request: Request) {
  try {
    const body: CreateOrderRequest = await request.json();

    // Validate required fields
    if (!body.items?.length || !body.customerName || !body.customerPhone || !body.card || !body.deviceFingerprint) {
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
      // Validate quantity
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
    const total = subtotal; // No tax/fees for now

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

    // Tokenize card
    let token: string;
    try {
      const tokenRes = await tokenizeCard({
        number: body.card.number,
        expMonth: body.card.expMonth,
        expYear: body.card.expYear,
        cvv: body.card.cvv,
        holderName: body.card.holderName,
      });
      token = tokenRes.token;
    } catch {
      console.error("[Payment] Tokenization failed for order:", order.id);
      await supabaseAdmin
        .from("orders")
        .update({ payment_status: "failed", status: "cancelled" })
        .eq("id", order.id);
      return NextResponse.json({ error: "Error con la tarjeta" }, { status: 400 });
    }

    // Create charge
    try {
      const chargeRes = await createCharge({
        token,
        amount: total,
        description: `CUNPOLLO Pedido #${order.order_number}`,
        orderId: order.id,
        deviceFingerprint: body.deviceFingerprint,
      });

      await supabaseAdmin
        .from("orders")
        .update({
          status: "paid",
          payment_status: "success",
          payment_reference: chargeRes.id,
        })
        .eq("id", order.id);

      // Fetch complete order for notifications
      const { data: fullOrder } = await supabaseAdmin
        .from("orders")
        .select()
        .eq("id", order.id)
        .single();

      if (fullOrder) {
        notifyCustomerStatusChange(fullOrder);
        notifyAdminNewOrder(fullOrder);
      }

      return NextResponse.json({
        orderId: order.id,
        orderNumber: order.order_number,
      });
    } catch {
      console.error("[Payment] Charge failed for order:", order.id);
      await supabaseAdmin
        .from("orders")
        .update({ payment_status: "failed", status: "cancelled" })
        .eq("id", order.id);
      return NextResponse.json({ error: "Error al procesar el pago" }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
