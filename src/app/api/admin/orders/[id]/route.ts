import { NextResponse } from "next/server";
import { verifyAdmin, verifyCsrfOrigin } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase/server";
import { notifyCustomerStatusChange } from "@/lib/twilio";
import { logAdminAction } from "@/lib/audit-log";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Valid state transitions
const VALID_TRANSITIONS: Record<string, string[]> = {
  pending: ["paid", "cancelled"],
  paid: ["preparing", "cancelled"],
  preparing: ["ready", "cancelled"],
  ready: ["picked_up"],
  picked_up: [],
  cancelled: [],
};

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!verifyCsrfOrigin(request)) {
    return NextResponse.json({ error: "Origen no permitido" }, { status: 403 });
  }

  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { id } = await params;

  if (!UUID_REGEX.test(id)) {
    return NextResponse.json({ error: "ID invalido" }, { status: 400 });
  }

  const { status } = await request.json();

  const validStatuses = ["pending", "paid", "preparing", "ready", "picked_up", "cancelled"];
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: "Estado invalido" }, { status: 400 });
  }

  // Get current order to validate state transition
  const { data: current } = await supabaseAdmin
    .from("orders")
    .select("status")
    .eq("id", id)
    .single();

  if (!current) {
    return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
  }

  const allowed = VALID_TRANSITIONS[current.status] || [];
  if (!allowed.includes(status)) {
    return NextResponse.json(
      { error: `No se puede cambiar de "${current.status}" a "${status}"` },
      { status: 400 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from("orders")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: "Error al actualizar" }, { status: 500 });
  }

  notifyCustomerStatusChange(data);

  // Audit log (fire-and-forget)
  logAdminAction({
    action: "update_status",
    entityType: "order",
    entityId: id,
    oldValue: { status: current.status },
    newValue: { status },
  });

  return NextResponse.json(data);
}
