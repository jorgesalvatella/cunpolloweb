import { FEATURES, RESTAURANT } from "./constants";
import type { Order } from "@/types/order";

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_WHATSAPP_FROM = process.env.TWILIO_WHATSAPP_FROM || "whatsapp:+529983871387";
const ADMIN_WHATSAPP_PHONES = process.env.ADMIN_WHATSAPP_PHONES || "";

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

function formatPhone(phone: string): string {
  const cleaned = phone.replace(/[\s\-()]/g, "");
  if (cleaned.startsWith("whatsapp:")) return cleaned;
  return `whatsapp:${cleaned}`;
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
      return [
        `CUNPOLLO - Pedido #${order_number} confirmado`,
        "",
        "Tu pedido fue pagado exitosamente:",
        itemLines,
        "",
        `Total: ${formatCurrency(total)}`,
        "",
        `Recogelo en: ${RESTAURANT.address.street}, ${RESTAURANT.address.city}`,
        `Te esperamos en aprox. 20 minutos.`,
        "",
        `Dudas? Llamanos al ${RESTAURANT.phone}`,
      ].join("\n");
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

  return [
    `NUEVO PEDIDO #${order.order_number}`,
    "",
    `Cliente: ${order.customer_name}`,
    `Telefono: ${order.customer_phone}`,
    "",
    "Items:",
    itemLines,
    "",
    `Total: ${formatCurrency(order.total)}`,
  ].join("\n");
}

export async function sendWhatsAppTemplate(
  to: string,
  contentSid: string,
  variables?: Record<string, string>
): Promise<{ success: boolean; error?: string }> {
  if (!isConfigured()) {
    return { success: false, error: "Twilio not configured" };
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
  const auth = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString("base64");

  const params = new URLSearchParams({
    From: TWILIO_WHATSAPP_FROM,
    To: formatPhone(to),
    ContentSid: contentSid,
  });

  if (variables) {
    params.set("ContentVariables", JSON.stringify(variables));
  }

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
    console.error(`[Twilio] Template send error to ${to}: ${res.status} ${error}`);
    return { success: false, error: `${res.status}: ${error}` };
  }

  return { success: true };
}

export function notifyCustomerStatusChange(order: Order): void {
  if (!isConfigured()) return;

  const message = getCustomerMessage(order);
  if (!message) return;

  const to = formatPhone(order.customer_phone);
  sendWhatsApp(to, message).catch((err) => {
    console.error("[Twilio] Failed to notify customer:", err);
  });
}

export function notifyAdminNewOrder(order: Order): void {
  if (!isConfigured()) return;

  const phones = ADMIN_WHATSAPP_PHONES.split(",")
    .map((p) => p.trim())
    .filter(Boolean);

  if (phones.length === 0) return;

  const message = getAdminMessage(order);

  const promises = phones.map((phone) =>
    sendWhatsApp(formatPhone(phone), message)
  );

  Promise.allSettled(promises).catch((err) => {
    console.error("[Twilio] Failed to notify admins:", err);
  });
}
