import { getSupabaseAdmin } from "@/lib/supabase/server";

export interface WaCampaignInfo {
  slug: string;
  title: string;
  details: string;
  image_url?: string | null;
}

export interface CampaignContext {
  /** Slug de la campaña por la que el cliente nos contactó (si se pudo resolver) */
  currentSlug: string | null;
  /** campaign_id (tabla campaigns) si se resolvió vía campaign_sends */
  campaignId: string | null;
  /** Toda la info activa de wa_campaign_info (se inyecta al prompt) */
  infos: WaCampaignInfo[];
}

const RECENT_SEND_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

export async function getActiveCampaignInfos(): Promise<WaCampaignInfo[]> {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("wa_campaign_info")
    .select("slug, title, details, image_url")
    .eq("active", true)
    .in("channel", ["all", "whatsapp"]);
  return (data as WaCampaignInfo[]) || [];
}

function matchSlugInText(infos: WaCampaignInfo[], text: string): string | null {
  const lower = text.toLowerCase();
  const match = infos.find((i) => lower.includes(i.slug.toLowerCase()));
  return match?.slug || null;
}

/**
 * Resuelve el contexto de campaña de un mensaje entrante:
 * 1. ButtonPayload con formato `campana:accion` (quick reply de template)
 * 2. OriginalRepliedMessageSid → lookup en campaign_sends
 * 3. Último envío de campaña reciente (<7 días) a ese teléfono
 */
export async function resolveCampaignContext(params: {
  phone: string;
  buttonPayload?: string;
  originalRepliedMessageSid?: string;
}): Promise<CampaignContext> {
  const infos = await getActiveCampaignInfos();
  const supabase = getSupabaseAdmin();

  // 1. ButtonPayload: "cunpacks:info" → slug "cunpacks"
  if (params.buttonPayload) {
    const slug = params.buttonPayload.split(":")[0]?.trim().toLowerCase();
    if (slug) {
      return { currentSlug: slug, campaignId: null, infos };
    }
  }

  // 2. Respuesta directa a un mensaje de campaña (quoted reply)
  if (params.originalRepliedMessageSid) {
    const { data } = await supabase
      .from("campaign_sends")
      .select("campaign_id, campaigns(template_name)")
      .eq("message_sid", params.originalRepliedMessageSid)
      .maybeSingle();

    if (data) {
      const templateName =
        (data.campaigns as unknown as { template_name?: string })?.template_name || "";
      return {
        currentSlug: matchSlugInText(infos, templateName),
        campaignId: data.campaign_id,
        infos,
      };
    }
  }

  // 3. Envío de campaña reciente al mismo teléfono (match por últimos 10 dígitos)
  const digits = params.phone.replace(/\D/g, "").slice(-10);
  if (digits.length === 10) {
    const since = new Date(Date.now() - RECENT_SEND_WINDOW_MS).toISOString();
    const { data } = await supabase
      .from("campaign_sends")
      .select("campaign_id, created_at, campaigns(template_name)")
      .like("phone", `%${digits}`)
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data) {
      const templateName =
        (data.campaigns as unknown as { template_name?: string })?.template_name || "";
      return {
        currentSlug: matchSlugInText(infos, templateName),
        campaignId: data.campaign_id,
        infos,
      };
    }
  }

  return { currentSlug: null, campaignId: null, infos };
}
