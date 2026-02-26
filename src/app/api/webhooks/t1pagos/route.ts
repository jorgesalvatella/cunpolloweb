import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { evento, datos } = body;

    if (!evento || !datos?.referencia) {
      return NextResponse.json({ ok: true });
    }

    const orderId = datos.referencia;

    if (evento === "cargo.exitoso") {
      await supabaseAdmin
        .from("orders")
        .update({
          payment_status: "success",
          status: "paid",
          payment_reference: datos.id_cargo || datos.id,
        })
        .eq("id", orderId);
    } else if (evento === "cargo.fallido") {
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
    console.error("Webhook error:", err);
    return NextResponse.json({ ok: true });
  }
}
