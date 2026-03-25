export interface WhatsAppTemplate {
  /** Display label in Spanish for admin UI */
  label: string;
  /** Twilio-friendly name (matches Meta template name) */
  name: string;
  /** Twilio Content SID */
  contentSid: string;
  /** Number of variables the template expects */
  variableCount: number;
  /** Human-readable labels for each variable (index 0 = {{1}}, etc.) */
  variableLabels: string[];
  /** Whether variable {{1}} is auto-filled with the contact name */
  autoNameVariable: boolean;
  /** Template body with {{N}} placeholders for live preview */
  bodyPreview: string;
  /** Template category */
  category: "marketing" | "utility" | "authentication";
  /** If true, template is known to fail and should not be selectable */
  broken?: boolean;
  /** Reason the template is broken */
  brokenReason?: string;
}

/**
 * Registry of all WhatsApp templates in this WABA.
 * Only marketing templates with broken=false are shown in the SendPromo selector.
 *
 * NOTE: Meta is blocking new template creation on this WABA due to quality score.
 * Do NOT delete entries — mark as broken instead.
 */
export const WHATSAPP_TEMPLATES: WhatsAppTemplate[] = [
  // --- Marketing templates (selectable) ---
  {
    label: "Promo Pickup/Dine-in v4",
    name: "cunpollo_pickup_dinein_v4",
    contentSid: "HXb3db04cf3e01c0b393c3dd37712e375c",
    variableCount: 1,
    variableLabels: ["Nombre del contacto"],
    autoNameVariable: true,
    bodyPreview:
      "Hola {{1}}! Como vas a disfrutar tu CUNPOLLO hoy?\n\nPara llevar (Pickup): Ordena en cunpollo.com y recoge en 20 min\nComer aqui (Dine-in): Ven con familia y amigos a nuestro restaurante\n\nTe esperamos en Av. Rodrigo Gomez, SM 13, Cancun",
    category: "marketing",
  },
  {
    label: "Carrusel Promo v1",
    name: "cunpollo_carrousel_1",
    contentSid: "HX74aacffb7908886380e4b05905e8c81a",
    variableCount: 1,
    variableLabels: ["Nombre del contacto"],
    autoNameVariable: true,
    bodyPreview:
      "Hola {{1}}! Tenemos una promo especial para ti hoy en CUNPOLLO",
    category: "marketing",
  },
  {
    label: "Lanzamiento Renovado",
    name: "cunpollo_renovado_launch",
    contentSid: "HXc9c1f39565e3a7e5ea3f5d72b42f3f75",
    variableCount: 1,
    variableLabels: ["Nombre del contacto"],
    autoNameVariable: true,
    bodyPreview:
      "CUNPOLLO esta de regreso y mejor que nunca!\n\n{{1}}, llevamos tiempo preparando algo especial para ti. Ven a conocer nuestro nuevo menu en cunpollo.com",
    category: "marketing",
  },

  {
    label: "Promo Card v2 (con imagen)",
    name: "cunpollo_pickup_dinein_card_v2",
    contentSid: "HX43df547ca31ad2d0f6b9b060da9bbf83",
    variableCount: 1,
    variableLabels: ["Nombre del contacto"],
    autoNameVariable: true,
    bodyPreview:
      "Hola {{1}}! Como vas a disfrutar tu CUNPOLLO hoy?\n\nPara llevar: Ordena en cunpollo.com y recoge en 20 min\nComer aqui: Ven con familia y amigos a nuestro restaurante",
    category: "marketing",
  },

  // --- Utility templates (not for marketing, excluded from selector) ---
  // order_confirmed, order_preparing, order_ready, order_cancelled,
  // cunpollo_new_order_admin_v3 — managed in twilio.ts ORDER_TEMPLATES
];

/** Marketing templates that are working and selectable in the admin UI */
export function getSelectableTemplates(): WhatsAppTemplate[] {
  return WHATSAPP_TEMPLATES.filter(
    (t) => t.category === "marketing" && !t.broken
  );
}

/** Find a template by its contentSid */
export function getTemplateBySid(
  contentSid: string
): WhatsAppTemplate | undefined {
  return WHATSAPP_TEMPLATES.find((t) => t.contentSid === contentSid);
}
