import { getSupabaseAdmin } from "@/lib/supabase/server";
import { getAdminRole } from "@/lib/admin-auth";

export async function logAdminAction({
  action,
  entityType,
  entityId,
  oldValue,
  newValue,
}: {
  action: string;
  entityType: string;
  entityId?: string;
  oldValue?: unknown;
  newValue?: unknown;
}) {
  try {
    const role = await getAdminRole();
    const supabase = getSupabaseAdmin();
    await supabase.from("admin_audit_log").insert({
      admin_user: role || "unknown",
      action,
      entity_type: entityType,
      entity_id: entityId || null,
      old_value: oldValue ? JSON.parse(JSON.stringify(oldValue)) : null,
      new_value: newValue ? JSON.parse(JSON.stringify(newValue)) : null,
    });
  } catch (err) {
    console.error("[AuditLog] Failed to log:", err);
  }
}
