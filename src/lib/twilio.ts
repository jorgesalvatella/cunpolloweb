import { FEATURES, RESTAURANT } from "./constants";
import type { Order } from "@/types/order";

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_WHATSAPP_FROM = process.env.TWILIO_WHATSAPP_FROM || "whatsapp:+5219983871387";
const ADMIN_WHATSAPP_PHONES = process.env.ADMIN_WHATSAPP_PHONES || "";

const ORDER_TEMPLATES = {
  paid: "HXe143bed5f4275bbbf474b90e786c13bd",
  preparing: "HX6aff8112c4132390176675f61eeca319",
  ready: "HXbb486ff7a35664d57d39dc76a1c6fc6d",
  cancelled: "HXedd7f5a92740634f330fbc5a3198d3c9",
} as const;

// Reuse the working order_confirmed template for admin notifications
// (new templates are being blocked by Meta quality restrictions)
const ADMIN_NEW_ORDER_TEMPLATE = "HXe143bed5f4275bbbf474b90e786c13bd";

function isConfigured(): boolean {
  return !!(TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && FEATURES.WHATSAPP_NOTIFICATIONS);
}

async function sendWhatsApp(to: string, body: string): Promise<void> {
  if (!isConfigured()) return;

  const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
  const auth = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString("base64");

  const params = new URLSearchParams({
    From: TWILIO_WHATSAPP_FROM,
    To: to,
    Body: body,
  });

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  if (!res.ok) {
    const error = await res.text();
    console.error(`[Twilio] Error sending to ${to}: ${res.status} ${error}`);
  }
}

export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/[\s\-()]/g, "");
  if (cleaned.startsWith("whatsapp:")) return cleaned;
  if (cleaned.startsWith("+")) return `whatsapp:${cleaned}`;
  // Mexican mobile numbers: +521 prefix (10-digit local numbers)
  if (cleaned.startsWith("521") && cleaned.length === 13) return `whatsapp:+${cleaned}`;
  if (cleaned.startsWith("52") && cleaned.length === 12) return `whatsapp:+${cleaned.slice(0, 2)}1${cleaned.slice(2)}`;
  // 10-digit local number → add +521
  return `whatsapp:+521${cleaned}`;
}

function formatCurrency(amount: number): string {
  return `$${amount.toFixed(2)} MXN`;
}

function getCustomerMessage(order: Order): string | null {
  const { status, order_number, total, items } = order;

  switch (status) {
    case "paid": {
      const itemLines = items
        .map((i) => `- ${i.quantity}x ${i.name} (${formatCurrency(i.lineTotal)})`)
        .join("\n");
      const typeLabel = order.order_type === "dine_in" ? "Comer en restaurante" : "Para llevar";
      const timeLine = order.pickup_time ? `Hora solicitada: ${order.pickup_time}` : "";
      const guestsLine = order.guests ? `Personas: ${order.guests}` : "";
      return [
        `CUNPOLLO - Pedido #${order_number} confirmado`,
        "",
        "Tu pedido fue pagado exitosamente:",
        itemLines,
        "",
        `Total: ${formatCurrency(total)}`,
        `Tipo: ${typeLabel}`,
        timeLine,
        guestsLine,
        "",
        `Recogelo en: ${RESTAURANT.address.street}, ${RESTAURANT.address.city}`,
        "",
        `Dudas? Llamanos al ${RESTAURANT.phone}`,
      ].filter(Boolean).join("\n");
    }
    case "preparing":
      return [
        `CUNPOLLO - Pedido #${order_number}`,
        "",
        "Tu pedido esta en preparacion. Te avisaremos cuando este listo.",
      ].join("\n");
    case "ready":
      return [
        `CUNPOLLO - Pedido #${order_number}`,
        "",
        "Tu pedido esta LISTO para recoger!",
        "",
        `Direccion: ${RESTAURANT.address.street}, ${RESTAURANT.address.city}`,
        `Telefono: ${RESTAURANT.phone}`,
      ].join("\n");
    case "picked_up":
      return [
        `CUNPOLLO - Pedido #${order_number}`,
        "",
        "Gracias por tu compra! Esperamos que lo disfrutes.",
        "Visitanos de nuevo pronto.",
      ].join("\n");
    case "cancelled":
      return [
        `CUNPOLLO - Pedido #${order_number}`,
        "",
        "Tu pedido fue cancelado.",
        `Si tienes dudas, contactanos al ${RESTAURANT.phone}`,
      ].join("\n");
    default:
      return null;
  }
}

function getAdminMessage(order: Order): string {
  const itemLines = order.items
    .map((i) => `- ${i.quantity}x ${i.name}`)
    .join("\n");

  const typeLabel = order.order_type === "dine_in" ? "Comer aqui" : "Para llevar";
  const timeLine = order.pickup_time ? `Hora: ${order.pickup_time}` : "";
  const guestsLine = order.guests ? `Personas: ${order.guests}` : "";

  return [
    `NUEVO PEDIDO #${order.order_number}`,
    "",
    `Cliente: ${order.customer_name}`,
    `Telefono: ${order.customer_phone}`,
    `Tipo: ${typeLabel}`,
    timeLine,
    guestsLine,
    "",
    "Items:",
    itemLines,
    "",
    `Total: ${formatCurrency(order.total)}`,
  ].filter(Boolean).join("\n");
}

export async function sendWhatsAppTemplate(
  to: string,
  contentSid: string,
  variables?: Record<string, string>
): Promise<{ success: boolean; error?: string; messageSid?: string }> {
  if (!isConfigured()) {
    return { success: false, error: "Twilio not configured" };
  }

  const formattedTo = formatPhone(to);
  const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
  const auth = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString("base64");

  const params = new URLSearchParams({
    From: TWILIO_WHATSAPP_FROM,
    To: formattedTo,
    ContentSid: contentSid,
  });

  if (variables) {
    params.set("ContentVariables", JSON.stringify(variables));
  }

  console.log(`[Twilio] Sending template ${contentSid} from ${TWILIO_WHATSAPP_FROM} to ${formattedTo}`);

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  const responseBody = await res.text();

  if (!res.ok) {
    console.error(`[Twilio] Template send error to ${formattedTo}: ${res.status} ${responseBody}`);
    return { success: false, error: `${res.status}: ${responseBody}` };
  }

  // Parse response to get message SID and status
  try {
    const data = JSON.parse(responseBody);
    console.log(`[Twilio] Message queued: SID=${data.sid} status=${data.status} to=${formattedTo}`);
    if (data.status === "failed" || data.status === "undelivered") {
      return { success: false, error: `Twilio status: ${data.status} (code: ${data.error_code})`, messageSid: data.sid };
    }
    return { success: true, messageSid: data.sid };
  } catch {
    return { success: true };
  }
}

export function notifyCustomerStatusChange(order: Order): void {
  if (!isConfigured()) return;

  const templateSid = ORDER_TEMPLATES[order.status as keyof typeof ORDER_TEMPLATES];
  if (!templateSid) return;

  const to = formatPhone(order.customer_phone);

  let variables: Record<string, string>;

  if (order.status === "paid") {
    const itemLines = order.items
      .map((i) => `- ${i.quantity}x ${i.name} (${formatCurrency(i.lineTotal)})`)
      .join("\n");
    const typeLabel = order.order_type === "dine_in" ? "Comer en restaurante" : "Para llevar";
    variables = {
      "1": order.customer_name,
      "2": String(order.order_number),
      "3": itemLines,
      "4": formatCurrency(order.total),
      "5": typeLabel,
    };
  } else {
    variables = {
      "1": order.customer_name,
      "2": String(order.order_number),
    };
  }

  sendWhatsAppTemplate(to, templateSid, variables).catch((err) => {
    console.error("[Twilio] Failed to notify customer:", err);
  });
}

export function notifyAdminNewOrder(order: Order): void {
  if (!isConfigured()) return;

  const phones = ADMIN_WHATSAPP_PHONES.split(",")
    .map((p) => p.trim())
    .filter(Boolean);

  if (phones.length === 0) return;

  const typeLabel = order.order_type === "dine_in" ? "Comer aqui" : "Para llevar";
  const itemLines = order.items
    .map((i) => `- ${i.quantity}x ${i.name} (${formatCurrency(i.lineTotal)})`)
    .join("\n");

  // Uses order_confirmed template (5 vars) since new templates are blocked by Meta
  const variables = {
    "1": `ADMIN - ${order.customer_name}`,
    "2": String(order.order_number),
    "3": itemLines,
    "4": formatCurrency(order.total),
    "5": typeLabel,
  };

  const promises = phones.map((phone) =>
    sendWhatsAppTemplate(formatPhone(phone), ADMIN_NEW_ORDER_TEMPLATE, variables)
  );

  Promise.allSettled(promises).catch((err) => {
    console.error("[Twilio] Failed to notify admins:", err);
  });
}
