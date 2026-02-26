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
    if (!body.items?.length || !body.customerName || !body.customerPhone || !body.card) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }

    // Validate items and recalculate prices server-side
    const orderItems: OrderItem[] = [];
    for (const item of body.items) {
      const menuItem = getMenuItemById(item.menuItemId);
      if (!menuItem || !menuItem.available) {
        return NextResponse.json(
          { error: `Producto no disponible: ${item.menuItemId}` },
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
        customer_name: body.customerName,
        customer_phone: body.customerPhone,
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
    } catch (err) {
      console.error("Tokenize error:", err);
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
    } catch (err) {
      console.error("Charge error:", err);
      await supabaseAdmin
        .from("orders")
        .update({ payment_status: "failed", status: "cancelled" })
        .eq("id", order.id);
      return NextResponse.json({ error: "Error al procesar el pago" }, { status: 400 });
    }
  } catch (err) {
    console.error("Order error:", err);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
