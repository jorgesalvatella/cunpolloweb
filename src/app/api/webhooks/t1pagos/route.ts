import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { notifyCustomerStatusChange } from "@/lib/twilio";

// ClaroPagos webhook payload structure
// Docs: https://docs.t1pagos.com/docs/webhooks.html
// Events: cargo.exitoso, cargo.fallido, cargo.cancelado, cargo.reembolsado

type WebhookPayload = {
  id: string;
  tipo: string;
  estatus: string;
  creacion: string;
  datos: {
    id: string;
    monto: number;
    estatus: string;
    codigo: string;
    descripcion: string;
    orden_id: string;
    pedido?: {
      id_externo?: string;
    };
    cliente?: {
      id: string;
      nombre: string;
    };
    tarjeta?: {
      marca: string;
      terminacion: string;
    };
  };
};

export async function POST(request: Request) {
  try {
    const body: WebhookPayload = await request.json();
    const { tipo, datos } = body;

    if (!tipo || !datos) {
      return NextResponse.json({ ok: true });
    }

    // The order ID is stored as id_externo in pedido, or fallback to orden_id
    const orderId = datos.pedido?.id_externo || datos.orden_id;
    if (!orderId) {
      console.warn("[Webhook] No order ID found in payload:", body);
      return NextResponse.json({ ok: true });
    }

    if (tipo === "cargo.exitoso") {
      const { data } = await supabaseAdmin
        .from("orders")
        .update({
          payment_status: "success",
          status: "paid",
          payment_reference: datos.id,
        })
        .eq("id", orderId)
        .select()
        .single();

      if (data) {
        notifyCustomerStatusChange(data);
      }
    } else if (tipo === "cargo.fallido" || tipo === "cargo.cancelado") {
      await supabaseAdmin
        .from("orders")
        .update({
          payment_status: "failed",
          status: "cancelled",
        })
        .eq("id", orderId);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[Webhook] Error:", err);
    return NextResponse.json({ ok: true });
  }
}
