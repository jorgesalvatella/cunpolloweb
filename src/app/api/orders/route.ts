import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import {
  calculateEffectivePrice,
  getActivePromotions,
  calculateOrderDiscount,
  dbToMenuItem,
} from "@/lib/menu-data";
import { createCharge, createBankCharge } from "@/lib/openpay";
import { checkRateLimit } from "@/lib/rate-limit";
import type { CreateOrderRequest, OrderItem } from "@/types/order";
import type { DbMenuItem } from "@/types/menu";

const VALID_ORIGINS = [
  "https://cunpollo.com",
  "https://www.cunpollo.com",
  "https://cunpolloweb.vercel.app",
];

export async function POST(request: Request) {
  try {
    // Rate limit: 10 requests per minute per IP
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const rl = checkRateLimit(`orders:${ip}`, 10, 60_000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Demasiados intentos. Espera un momento." },
        { status: 429, headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) } }
      );
    }

    const body: CreateOrderRequest = await request.json();

    const paymentMethod = body.paymentMethod || "card";

    // Validate required fields
    if (
      !body.items?.length ||
      !body.customerName ||
      !body.customerPhone ||
      !body.orderType ||
      !body.pickupTime
    ) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }

    // Card-specific validation
    if (paymentMethod === "card" && (!body.tokenId || !body.deviceSessionId)) {
      return NextResponse.json({ error: "Datos de tarjeta incompletos" }, { status: 400 });
    }

    // Validate payment method
    if (!["card", "spei"].includes(paymentMethod)) {
      return NextResponse.json({ error: "Metodo de pago invalido" }, { status: 400 });
    }

    // Validate order type
    if (!["dine_in", "pickup"].includes(body.orderType)) {
      return NextResponse.json({ error: "Tipo de pedido invalido" }, { status: 400 });
    }

    // Validate pickup time format (H:MM or HH:MM)
    if (!/^\d{1,2}:\d{2}$/.test(body.pickupTime)) {
      return NextResponse.json({ error: "Horario invalido" }, { status: 400 });
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

    // Validate idempotency key if provided
    if (body.idempotencyKey) {
      const { data: existing } = await supabaseAdmin
        .from("orders")
        .select("id, order_number, payment_status")
        .eq("idempotency_key", body.idempotencyKey)
        .single();

      if (existing) {
        return NextResponse.json({
          orderId: existing.id,
          orderNumber: existing.order_number,
          duplicate: true,
        });
      }
    }

    // Batch fetch all menu items in a single query (fix N+1)
    const menuItemIds = body.items.map((i) => i.menuItemId);
    const { data: rawMenuItems, error: menuError } = await supabaseAdmin
      .from("menu_items")
      .select("*")
      .in("id", menuItemIds)
      .eq("available", true);

    if (menuError || !rawMenuItems) {
      return NextResponse.json({ error: "Error al verificar productos" }, { status: 500 });
    }

    const menuItemsMap = new Map(
      (rawMenuItems as DbMenuItem[]).map((row) => [row.id, dbToMenuItem(row)])
    );

    // Validate items and recalculate prices server-side from DB
    const orderItems: OrderItem[] = [];
    for (const item of body.items) {
      if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 100) {
        return NextResponse.json({ error: "Cantidad invalida (1-100)" }, { status: 400 });
      }

      const menuItem = menuItemsMap.get(item.menuItemId);
      if (!menuItem || menuItem.promo) {
        return NextResponse.json(
          { error: "Uno o mas productos no estan disponibles" },
          { status: 400 }
        );
      }
      const effectivePrice = calculateEffectivePrice(menuItem);
      orderItems.push({
        menuItemId: item.menuItemId,
        name: menuItem.name.es,
        quantity: item.quantity,
        unitPrice: effectivePrice,
        lineTotal: effectivePrice * item.quantity,
      });
    }

    const subtotal = orderItems.reduce((sum, i) => sum + i.lineTotal, 0);

    // Apply order-level promotion discount
    const promos = await getActivePromotions(body.orderType);
    const discount = calculateOrderDiscount(subtotal, body.orderType, promos);
    const total = subtotal - discount.amount;

    // Create order in Supabase (status: pending)
    const insertData: Record<string, unknown> = {
      customer_name: name,
      customer_phone: phone,
      items: orderItems,
      subtotal,
      total,
      status: "pending",
      payment_status: paymentMethod === "spei" ? "pending_spei" : "processing",
      payment_method: paymentMethod,
      order_type: body.orderType,
      pickup_time: body.pickupTime,
      guests: body.orderType === "dine_in" ? body.guests : null,
      discount_amount: discount.amount,
      discount_description: discount.description || null,
      promotion_id: discount.promotionId || null,
    };
    if (body.idempotencyKey) {
      insertData.idempotency_key = body.idempotencyKey;
    }

    const { data: order, error: dbError } = await supabaseAdmin
      .from("orders")
      .insert(insertData)
      .select("id, order_number")
      .single();

    if (dbError || !order) {
      console.error("DB error:", dbError);
      return NextResponse.json({ error: "Error al crear el pedido" }, { status: 500 });
    }

    // Build redirect URL for 3D Secure (validate origin against whitelist)
    const rawOrigin = request.headers.get("origin") || "";
    const origin = VALID_ORIGINS.includes(rawOrigin) ? rawOrigin : "https://cunpollo.com";
    const locale = request.headers.get("accept-language")?.startsWith("en") ? "en" : "es";
    const confirmationUrl = `${origin}/${locale}/confirmation/${order.id}`;

    const itemNames = orderItems.map((i) => `${i.name} x${i.quantity}`).join(", ");

    // SPEI branch — generate bank reference and return early
    if (paymentMethod === "spei") {
      const dueDate = new Date(Date.now() + 3 * 60 * 60 * 1000);
      const dueDateStr = dueDate.toISOString().replace("T", " ").slice(0, 19);

      const speiResult = await createBankCharge({
        amount: total,
        description: `CUNPOLLO Pedido #${order.order_number}: ${itemNames}`.slice(0, 250),
        orderId: order.id,
        customerName: name,
        customerEmail: body.customerEmail,
        dueDate: dueDateStr,
      });

      if (!speiResult.success) {
        await supabaseAdmin
          .from("orders")
          .update({ payment_status: "failed", status: "cancelled" })
          .eq("id", order.id);

        return NextResponse.json(
          { error: speiResult.error || "Error al generar referencia SPEI" },
          { status: 402 }
        );
      }

      const speiDetails = {
        clabe: speiResult.speiDetails?.clabe || "",
        bank: speiResult.speiDetails?.bank || "",
        agreement: speiResult.speiDetails?.agreement || "",
        name: speiResult.speiDetails?.name || "",
        due_date: dueDateStr,
      };

      await supabaseAdmin
        .from("orders")
        .update({
          payment_reference: speiResult.chargeId,
          spei_details: speiDetails,
        })
        .eq("id", order.id);

      return NextResponse.json({
        orderId: order.id,
        orderNumber: order.order_number,
        speiDetails,
      });
    }

    // Process card payment with Openpay
    const chargeResult = await createCharge({
      tokenId: body.tokenId!,
      deviceSessionId: body.deviceSessionId!,
      amount: total,
      description: `CUNPOLLO Pedido #${order.order_number}: ${itemNames}`.slice(0, 250),
      orderId: order.id,
      customerName: name,
      redirectUrl: confirmationUrl,
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

    // If 3D Secure is required, redirect the customer
    if (chargeResult.redirectUrl) {
      await supabaseAdmin
        .from("orders")
        .update({
          payment_status: "pending_3ds",
          payment_reference: chargeResult.chargeId,
          status: "pending",
        })
        .eq("id", order.id);

      return NextResponse.json({
        orderId: order.id,
        orderNumber: order.order_number,
        redirectUrl: chargeResult.redirectUrl,
      });
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

    // Fire-and-forget WhatsApp notifications
    try {
      const { notifyAdminNewOrder, notifyCustomerStatusChange } = await import("@/lib/twilio");
      const orderData = {
        id: order.id,
        order_number: order.order_number,
        customer_name: name,
        customer_phone: phone,
        items: orderItems,
        subtotal,
        total,
        status: "paid" as const,
        payment_status: "success" as const,
        payment_method: "card" as const,
        spei_details: null,
        payment_reference: chargeResult.chargeId || null,
        order_type: body.orderType,
        pickup_time: body.pickupTime,
        guests: body.orderType === "dine_in" ? body.guests : null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      notifyAdminNewOrder(orderData);
      notifyCustomerStatusChange(orderData);
    } catch {}

    return NextResponse.json({
      orderId: order.id,
      orderNumber: order.order_number,
    });
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
