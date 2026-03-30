import { google } from "@ai-sdk/google";
import { streamText, stepCountIs } from "ai";
import { getSystemPrompt } from "@/lib/chat/system-prompt";
import { getChatTools } from "@/lib/chat/tools";
import { saveSession } from "@/lib/chat/session";
import { checkRateLimit } from "@/lib/rate-limit";
import { headers } from "next/headers";

export const maxDuration = 30;

export async function POST(req: Request) {
  // Rate limit: 20 requests per minute per IP
  const headersList = await headers();
  const ip =
    headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headersList.get("x-real-ip") ||
    "unknown";
  const { allowed, retryAfterMs } = checkRateLimit(
    `chat:${ip}`,
    20,
    60_000
  );
  if (!allowed) {
    return new Response(
      JSON.stringify({ error: "Too many requests" }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": String(Math.ceil(retryAfterMs / 1000)),
        },
      }
    );
  }

  const body = await req.json();
  const { messages, locale = "es", sessionId } = body;

  if (!messages || !Array.isArray(messages)) {
    return new Response(
      JSON.stringify({ error: "messages array is required" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const validLocale = locale === "en" ? "en" : "es";

  const result = streamText({
    model: google("gemini-2.0-flash"),
    system: getSystemPrompt(validLocale),
    messages,
    tools: getChatTools(validLocale),
    stopWhen: stepCountIs(5),
    onFinish: async ({ text }) => {
      if (sessionId && text) {
        const chatMessages = [
          ...messages.map((m: { role: string; content: string }) => ({
            role: m.role as "user" | "assistant",
            content: m.content,
            timestamp: new Date().toISOString(),
          })),
          {
            role: "assistant" as const,
            content: text,
            timestamp: new Date().toISOString(),
          },
        ];
        saveSession(sessionId, chatMessages, { locale: validLocale }).catch(
          () => {}
        );
      }
    },
  });

  return result.toUIMessageStreamResponse();
}
