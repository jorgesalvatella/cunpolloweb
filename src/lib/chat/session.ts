import { getSupabaseAdmin } from "@/lib/supabase/server";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
};

export async function saveSession(
  sessionId: string,
  messages: ChatMessage[],
  metadata: {
    locale?: string;
    customerPhone?: string;
    [key: string]: unknown;
  } = {}
) {
  const supabase = getSupabaseAdmin();

  const { error } = await supabase
    .from("chat_sessions")
    .upsert(
      {
        session_id: sessionId,
        messages: JSON.stringify(messages),
        locale: metadata.locale || "es",
        customer_phone: metadata.customerPhone || null,
        metadata: JSON.stringify(metadata),
      },
      { onConflict: "session_id" }
    );

  if (error) {
    console.error("[chat] Failed to save session:", error.message);
  }
}

export async function loadSession(
  sessionId: string
): Promise<ChatMessage[] | null> {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("chat_sessions")
    .select("messages")
    .eq("session_id", sessionId)
    .single();

  if (error || !data) return null;

  try {
    const messages =
      typeof data.messages === "string"
        ? JSON.parse(data.messages)
        : data.messages;
    return messages as ChatMessage[];
  } catch {
    return null;
  }
}
