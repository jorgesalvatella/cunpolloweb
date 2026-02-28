import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { notifyCustomerStatusChange } from "@/lib/twilio";

// T1 Pagos v2 webhook payload structure
// Docs: https://docs.t1pagos.com/docs/t1pagos_documentation.html
// Events: cargo.exitoso, cargo.fallido, cargo.cancelado, cargo.reembolsado

type WebhookPayload = {
  id: string;
  tipo_evento: string;
  estatus: string;
  data: {
    cargo: {
      id: string;
      monto: string;
      estatus: string;
      codigo: string;
      descripcion: string;
      orden_id?: string;
      pedido?: {
        id_externo?: string;
      };
      tarjeta?: {
        marca: string;
        terminacion: string;
      };
    };
  };
};

const WEBHOOK_USER = process.env.T1_WEBHOOK_USER;
const WEBHOOK_PASS = process.env.T1_WEBHOOK_PASS;

function verifyBasicAuth(request: Request): boolean {
  if (!WEBHOOK_USER || !WEBHOOK_PASS) return true; // skip if not configured

  const auth = request.headers.get("Authorization");
  if (!auth?.startsWith("Basic ")) return false;

  const decoded = atob(auth.slice(6));
  const [user, pass] = decoded.split(":");
  return user === WEBHOOK_USER && pass === WEBHOOK_PASS;
}

export async function POST(request: Request) {
  if (!verifyBasicAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body: WebhookPayload = await request.json();
    const { tipo_evento, data } = body;

    if (!tipo_evento || !data?.cargo) {
      return NextResponse.json({ ok: true });
    }

    const cargo = data.cargo;
    const orderId = cargo.pedido?.id_externo || cargo.orden_id;
    if (!orderId) {
      console.warn("[Webhook] No order ID found in payload:", body);
      return NextResponse.json({ ok: true });
    }

    if (tipo_evento === "cargo.exitoso") {
      const { data: order } = await supabaseAdmin
        .from("orders")
        .update({
          payment_status: "success",
          status: "paid",
          payment_reference: cargo.id,
        })
        .eq("id", orderId)
        .select()
        .single();

      if (order) {
        notifyCustomerStatusChange(order);
      }
    } else if (tipo_evento === "cargo.fallido" || tipo_evento === "cargo.cancelado") {
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
