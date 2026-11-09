import { FEATURES, RESTAURANT } from "@/lib/constants";
import { checkRateLimit } from "@/lib/rate-limit";
import { validateTwilioSignature } from "@/lib/wa-bot/signature";
import {
  getOrCreateConversation,
  appendMessage,
  getRecentMessages,
  setMode,
  setCampaign,
  hasHumanTimedOut,
} from "@/lib/wa-bot/conversation";
import { resolveCampaignContext } from "@/lib/wa-bot/campaign-context";
import { generateBotReply } from "@/lib/wa-bot/agent";
import { transferToAdvisor, notifyAdvisor } from "@/lib/wa-bot/transfer";
import { handleAdvisorCommand } from "@/lib/wa-bot/advisor-commands";

export const maxDuration = 30;

const WEBHOOK_URL =
  process.env.TWILIO_WEBHOOK_URL || "https://cunpollo.com/api/webhooks/twilio-whatsapp";

const ADVISOR_PHONE = process.env.WHATSAPP_ADVISOR_PHONE || "";

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function twiml(message?: string): Response {
  const inner = message ? `<Message>${escapeXml(message)}</Message>` : "";
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><Response>${inner}</Response>`,
    { headers: { "Content-Type": "text/xml" } }
  );
}

/** Últimos 10 dígitos (número local MX) — ignora el "1" extra de +521. */
function last10(phone: string): string {
  return phone.replace(/\D/g, "").slice(-10);
}

export async function POST(request: Request) {
  const raw = await request.text();
  const params = Object.fromEntries(new URLSearchParams(raw)) as Record<string, string>;

  const signature = request.headers.get("x-twilio-signature");
  if (!validateTwilioSignature(WEBHOOK_URL, params, signature)) {
    console.warn("[WA Bot] Firma Twilio inválida");
    return new Response("Forbidden", { status: 403 });
  }

  if (!FEATURES.WA_BOT_ENABLED) {
    return twiml();
  }

  const from = (params.From || "").replace(/^whatsapp:/, ""); // E.164, ej. +5219983871387
  const body = (params.Body || "").trim();
  const buttonPayload = params.ButtonPayload || undefined;
  const profileName = params.ProfileName || undefined;
  const messageSid = params.MessageSid || undefined;
  const originalRepliedMessageSid = params.OriginalRepliedMessageSid || undefined;

  if (!from) return twiml();

  try {
    // Mensajes del asesor: comandos #
    if (ADVISOR_PHONE && last10(from) === last10(ADVISOR_PHONE)) {
      const confirmation = await handleAdvisorCommand(body);
      return twiml(confirmation);
    }

    // Rate limit por teléfono
    const { allowed } = checkRateLimit(`wa:${from}`, 20, 60_000);
    if (!allowed) return twiml();

    const conversation = await getOrCreateConversation(from, profileName);

    // Timeout lazy: modo human inactivo >2h vuelve al bot
    let mode = conversation.mode;
    if (hasHumanTimedOut(conversation)) {
      await setMode(conversation.id, "bot");
      mode = "bot";
    }

    const userContent = body || (buttonPayload ? `[Botón: ${buttonPayload}]` : "");
    if (!userContent) {
      // Media u otro contenido no soportado
      await appendMessage(conversation.id, "user", "[contenido no soportado]", { messageSid });
      return twiml("Por ahora solo puedo leer mensajes de texto. ¿En qué te puedo ayudar?");
    }

    await appendMessage(conversation.id, "user", userContent, { messageSid, buttonPayload });

    // Modo human: reenviar al asesor, sin respuesta automática al cliente
    if (mode === "human") {
      const name = conversation.profile_name || "Cliente";
      notifyAdvisor(`${name} (${last10(from)}): ${userContent}`).catch((err) => {
        console.error("[WA Bot] Error reenviando mensaje al asesor:", err);
      });
      return twiml();
    }

    // Modo bot
    const campaignContext = await resolveCampaignContext({
      phone: from,
      buttonPayload,
      originalRepliedMessageSid,
    });

    if (campaignContext.campaignId && !conversation.campaign_id) {
      await setCampaign(conversation.id, campaignContext.campaignId);
    }

    // Botón "comprar" de campaña: traspaso directo sin pasar por Claude
    if (buttonPayload && buttonPayload.toLowerCase().endsWith(":comprar")) {
      const reply = await transferToAdvisor({
        conversation,
        motivo: `Quiere comprar (botón de campaña ${campaignContext.currentSlug || buttonPayload})`,
        lastUserMessage: userContent,
        campaignSlug: campaignContext.currentSlug,
      });
      await appendMessage(conversation.id, "assistant", reply);
      return twiml(reply);
    }

    const history = await getRecentMessages(conversation.id, 12);
    const { reply, transfer } = await generateBotReply({ history, campaignContext });

    if (transfer) {
      const transferReply = await transferToAdvisor({
        conversation,
        motivo: transfer.motivo,
        lastUserMessage: userContent,
        campaignSlug: campaignContext.currentSlug,
      });
      await appendMessage(conversation.id, "assistant", transferReply);
      return twiml(transferReply);
    }

    await appendMessage(conversation.id, "assistant", reply);
    return twiml(reply);
  } catch (err) {
    console.error("[WA Bot] Error en webhook:", err);
    return twiml(
      `Ups, tuve un problema. Escríbenos de nuevo o llámanos al ${RESTAURANT.phone}.`
    );
  }
}
