import { getSupabaseAdmin } from "@/lib/supabase/server";

export interface WaConversation {
  id: string;
  phone: string;
  profile_name: string | null;
  mode: "bot" | "human";
  campaign_id: string | null;
  transfer_reason: string | null;
  transferred_at: string | null;
  last_message_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface WaMessage {
  id: string;
  conversation_id: string;
  role: "user" | "assistant" | "advisor" | "system";
  content: string;
  message_sid: string | null;
  button_payload: string | null;
  created_at: string;
}

/** After 2h without activity in human mode, the conversation returns to the bot. */
export const HUMAN_MODE_TIMEOUT_MS = 2 * 60 * 60 * 1000;

export async function getOrCreateConversation(
  phone: string,
  profileName?: string
): Promise<WaConversation> {
  const supabase = getSupabaseAdmin();

  const row: Record<string, string> = { phone };
  if (profileName) row.profile_name = profileName;

  const { data, error } = await supabase
    .from("wa_conversations")
    .upsert(row, { onConflict: "phone" })
    .select()
    .single();

  if (error || !data) {
    throw new Error(`wa_conversations upsert failed: ${error?.message}`);
  }
  return data as WaConversation;
}

/** Finds a conversation whose phone ends with the given local digits (MX 10-digit). */
export async function findConversationByDigits(
  digits: string
): Promise<WaConversation | null> {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("wa_conversations")
    .select("*")
    .like("phone", `%${digits}`)
    .order("last_message_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (data as WaConversation) || null;
}

export async function appendMessage(
  conversationId: string,
  role: WaMessage["role"],
  content: string,
  extras?: { messageSid?: string; buttonPayload?: string }
): Promise<void> {
  const supabase = getSupabaseAdmin();

  await supabase.from("wa_messages").insert({
    conversation_id: conversationId,
    role,
    content,
    message_sid: extras?.messageSid || null,
    button_payload: extras?.buttonPayload || null,
  });

  await supabase
    .from("wa_conversations")
    .update({
      last_message_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", conversationId);
}

export async function getRecentMessages(
  conversationId: string,
  limit = 12
): Promise<WaMessage[]> {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("wa_messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .limit(limit);

  return ((data as WaMessage[]) || []).reverse();
}

export async function setMode(
  conversationId: string,
  mode: "bot" | "human",
  extras?: { transferReason?: string; campaignId?: string }
): Promise<void> {
  const supabase = getSupabaseAdmin();

  const update: Record<string, string | null> = {
    mode,
    updated_at: new Date().toISOString(),
  };
  if (mode === "human") {
    update.transferred_at = new Date().toISOString();
    if (extras?.transferReason) update.transfer_reason = extras.transferReason;
  }
  if (extras?.campaignId) update.campaign_id = extras.campaignId;

  await supabase.from("wa_conversations").update(update).eq("id", conversationId);
}

export async function setCampaign(
  conversationId: string,
  campaignId: string
): Promise<void> {
  const supabase = getSupabaseAdmin();
  await supabase
    .from("wa_conversations")
    .update({ campaign_id: campaignId, updated_at: new Date().toISOString() })
    .eq("id", conversationId);
}

/**
 * Lazy timeout check: if the conversation is in human mode but has been
 * inactive for more than 2h, it should return to bot mode.
 * Call BEFORE appending the incoming message (which bumps last_message_at).
 */
export function hasHumanTimedOut(conv: WaConversation): boolean {
  if (conv.mode !== "human") return false;
  const last = Math.max(
    conv.last_message_at ? new Date(conv.last_message_at).getTime() : 0,
    conv.transferred_at ? new Date(conv.transferred_at).getTime() : 0
  );
  if (!last) return true;
  return Date.now() - last > HUMAN_MODE_TIMEOUT_MS;
}
