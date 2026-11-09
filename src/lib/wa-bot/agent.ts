import { anthropic } from "@ai-sdk/anthropic";
import { generateText, stepCountIs, tool, zodSchema } from "ai";
import { z } from "zod";
import { getChatTools } from "@/lib/chat/tools";
import { RESTAURANT } from "@/lib/constants";
import { getWaSystemPrompt } from "./system-prompt";
import type { CampaignContext } from "./campaign-context";
import type { WaMessage } from "./conversation";

export const FALLBACK_REPLY = `Ups, tuve un problema para responderte. Escríbenos de nuevo en un momento o llámanos al ${RESTAURANT.phone}.`;

export interface BotReply {
  reply: string;
  transfer: { motivo: string } | null;
}

function toModelMessages(history: WaMessage[]) {
  return history
    .filter((m) => m.role === "user" || m.role === "assistant" || m.role === "advisor")
    .map((m) => ({
      role: m.role === "user" ? ("user" as const) : ("assistant" as const),
      content: m.role === "advisor" ? `[Asesor] ${m.content}` : m.content,
    }));
}

/**
 * Genera la respuesta del bot con Claude Haiku + tools del menú.
 * Si el modelo invoca transferir_a_asesor, se devuelve transfer.motivo
 * para que el webhook ejecute el flujo de traspaso.
 */
export async function generateBotReply(params: {
  history: WaMessage[];
  campaignContext: CampaignContext | null;
}): Promise<BotReply> {
  const { history, campaignContext } = params;

  let transferMotivo: string | null = null;

  const webTools = getChatTools("es");
  const tools = {
    search_menu: webTools.search_menu,
    get_categories: webTools.get_categories,
    get_promotions: webTools.get_promotions,
    search_knowledge: webTools.search_knowledge,
    transferir_a_asesor: tool({
      description:
        "Transfiere la conversación a un asesor humano. Úsala cuando el cliente quiere comprar, apartar, pagar, cotizar una fiesta o pide hablar con una persona.",
      inputSchema: zodSchema(
        z.object({
          motivo: z
            .string()
            .describe("Razón breve del traspaso, ej. 'Quiere comprar un Cunpack'"),
        })
      ),
      execute: async ({ motivo }: { motivo: string }) => {
        transferMotivo = motivo;
        return { ok: true, note: "Traspaso registrado. No escribas nada más al cliente." };
      },
    }),
  };

  try {
    const result = await generateText({
      model: anthropic("claude-haiku-4-5"),
      system: getWaSystemPrompt(campaignContext),
      messages: toModelMessages(history),
      tools,
      stopWhen: stepCountIs(3),
      maxOutputTokens: 400,
    });

    if (transferMotivo) {
      return { reply: "", transfer: { motivo: transferMotivo } };
    }

    const reply = result.text.trim();
    return { reply: reply || FALLBACK_REPLY, transfer: null };
  } catch (err) {
    console.error("[WA Bot] Error generando respuesta:", err);
    return { reply: FALLBACK_REPLY, transfer: null };
  }
}
