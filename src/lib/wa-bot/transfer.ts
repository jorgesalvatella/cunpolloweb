import { sendWhatsAppMessage, sendWhatsAppTemplate, formatPhone } from "@/lib/twilio";
import { RESTAURANT } from "@/lib/constants";
import { appendMessage, setMode, type WaConversation } from "./conversation";

const ADVISOR_PHONE = process.env.WHATSAPP_ADVISOR_PHONE || "";

// order_confirmed (5 vars) — Meta bloquea templates nuevos en esta WABA,
// se reutiliza como fallback cuando la ventana de 24h del asesor está cerrada (63016)
const FALLBACK_TEMPLATE_SID = "HXe143bed5f4275bbbf474b90e786c13bd";

const CLIENT_TRANSFER_MESSAGE =
  "¡Claro! Ya le avisé a nuestro asesor y en un momento te escribe por aquí mismo para ayudarte. Si es urgente, también puedes llamarnos al " +
  RESTAURANT.phone +
  ".";

/**
 * Notifica al asesor por WhatsApp. Intenta mensaje free-form; si la ventana
 * de 24h está cerrada (error 63016), cae a template order_confirmed.
 */
export async function notifyAdvisor(
  body: string,
  templateFallbackVars?: Record<string, string>
): Promise<void> {
  if (!ADVISOR_PHONE) {
    console.error("[WA Bot] WHATSAPP_ADVISOR_PHONE no configurado");
    return;
  }

  const result = await sendWhatsAppMessage(formatPhone(ADVISOR_PHONE), body);

  if (!result.success && result.errorCode === 63016 && templateFallbackVars) {
    console.warn("[WA Bot] Ventana 24h cerrada con asesor, usando template fallback");
    await sendWhatsAppTemplate(
      formatPhone(ADVISOR_PHONE),
      FALLBACK_TEMPLATE_SID,
      templateFallbackVars
    );
  }
}

/**
 * Traspasa la conversación a un asesor humano:
 * marca mode='human', notifica al asesor y devuelve el mensaje para el cliente.
 */
export async function transferToAdvisor(params: {
  conversation: WaConversation;
  motivo: string;
  lastUserMessage: string;
  campaignSlug?: string | null;
}): Promise<string> {
  const { conversation, motivo, lastUserMessage, campaignSlug } = params;

  await setMode(conversation.id, "human", { transferReason: motivo });
  await appendMessage(conversation.id, "system", `Transferido a asesor. Motivo: ${motivo}`);

  const name = conversation.profile_name || "Cliente";
  const advisorBody = [
    "TRASPASO DEL BOT CUNPOLLO",
    "",
    `Cliente: ${name}`,
    `Numero: ${conversation.phone}`,
    `Campana: ${campaignSlug || "-"}`,
    `Motivo: ${motivo}`,
    `Ultimo mensaje: "${lastUserMessage}"`,
    "",
    `Responde con #${conversation.phone.replace(/\D/g, "").slice(-10)} <mensaje>`,
    `Termina con #fin ${conversation.phone.replace(/\D/g, "").slice(-10)}`,
  ].join("\n");

  // Fallback template (5 vars, sin saltos de linea en los valores)
  const fallbackVars = {
    "1": `ASESOR - Traspaso bot: ${name}`,
    "2": conversation.phone.replace(/\D/g, "").slice(-10),
    "3": `Motivo: ${motivo} | Mensaje: ${lastUserMessage}`.slice(0, 300),
    "4": `Campana: ${campaignSlug || "-"}`,
    "5": "Responde #<numero> <mensaje>",
  };

  // No bloquear la respuesta al cliente si la notificacion falla
  notifyAdvisor(advisorBody, fallbackVars).catch((err) => {
    console.error("[WA Bot] Error notificando al asesor:", err);
  });

  return CLIENT_TRANSFER_MESSAGE;
}
