import { sendWhatsAppMessage, formatPhone } from "@/lib/twilio";
import {
  appendMessage,
  findConversationByDigits,
  setMode,
} from "./conversation";

const HELP_TEXT = [
  "Comandos del asesor CUNPOLLO:",
  "#<numero> <mensaje> - enviar mensaje al cliente",
  "#fin <numero> - terminar y devolver al bot",
  "Ejemplo: #9981234567 Hola, soy de CUNPOLLO",
].join("\n");

const CLIENT_END_MESSAGE =
  "Nuestro asesor ha finalizado la conversación. Sigo aquí si necesitas algo más. ¡Gracias por escribir a CUNPOLLO!";

type AdvisorCommand =
  | { type: "relay"; digits: string; message: string }
  | { type: "end"; digits: string }
  | { type: "invalid" };

export function parseAdvisorCommand(body: string): AdvisorCommand {
  const text = body.trim();

  const endMatch = text.match(/^#fin\s+(\+?[\d\s-]{7,})$/i);
  if (endMatch) {
    return { type: "end", digits: endMatch[1].replace(/\D/g, "").slice(-10) };
  }

  const relayMatch = text.match(/^#(\+?[\d\s-]{7,}?)\s+([\s\S]+)$/);
  if (relayMatch) {
    return {
      type: "relay",
      digits: relayMatch[1].replace(/\D/g, "").slice(-10),
      message: relayMatch[2].trim(),
    };
  }

  return { type: "invalid" };
}

/**
 * Ejecuta un comando del asesor y devuelve el texto de confirmación
 * que se le responde al asesor (vía TwiML).
 */
export async function handleAdvisorCommand(body: string): Promise<string> {
  const command = parseAdvisorCommand(body);

  if (command.type === "invalid") {
    return HELP_TEXT;
  }

  const conversation = await findConversationByDigits(command.digits);
  if (!conversation) {
    return `No encontré una conversación con el número ${command.digits}. Verifica los 10 dígitos.`;
  }

  if (command.type === "relay") {
    const result = await sendWhatsAppMessage(formatPhone(conversation.phone), command.message);
    if (!result.success) {
      return `No pude enviar el mensaje a ${command.digits} (${result.errorCode || "error"}). La ventana de 24h puede estar cerrada.`;
    }

    if (conversation.mode !== "human") {
      await setMode(conversation.id, "human", { transferReason: "Asesor tomó la conversación" });
    }
    await appendMessage(conversation.id, "advisor", command.message, {
      messageSid: result.messageSid,
    });

    return `Enviado a ${command.digits}.`;
  }

  // command.type === "end"
  await setMode(conversation.id, "bot");
  await appendMessage(conversation.id, "system", "Asesor finalizó la conversación (modo bot)");

  sendWhatsAppMessage(formatPhone(conversation.phone), CLIENT_END_MESSAGE).catch((err) => {
    console.error("[WA Bot] Error avisando fin al cliente:", err);
  });

  return `Listo, la conversación con ${command.digits} volvió al bot.`;
}
