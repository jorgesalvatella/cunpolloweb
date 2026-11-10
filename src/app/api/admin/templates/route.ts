import { NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin-auth";
import {
  getSelectableTemplates,
  getTemplateBySid,
  type WhatsAppTemplate,
} from "@/lib/whatsapp-templates";

export interface SyncedTemplate extends WhatsAppTemplate {
  /** Meta approval status from Twilio (approved, pending, rejected, paused...) */
  approvalStatus?: string;
}

interface TwilioContentItem {
  sid: string;
  friendly_name: string;
  variables?: Record<string, string>;
  types?: Record<string, { body?: string; title?: string }>;
  approval_requests?: {
    name?: string;
    category?: string;
    status?: string;
  };
}

/**
 * GET /api/admin/templates
 * Lists WhatsApp marketing templates live from Twilio Content API,
 * merged with local metadata (Spanish labels, previews, broken flags).
 * READ-ONLY against Twilio. Falls back to the local registry on any failure.
 */
export async function GET() {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const localTemplates = getSelectableTemplates();
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;

  if (!sid || !token) {
    return NextResponse.json({
      source: "local",
      templates: localTemplates,
      allTemplateNames: localTemplates.map((t) => t.name),
    });
  }

  try {
    const auth = Buffer.from(`${sid}:${token}`).toString("base64");
    const res = await fetch(
      "https://content.twilio.com/v1/ContentAndApprovals?PageSize=200",
      {
        headers: { Authorization: `Basic ${auth}` },
        // Templates change rarely; avoid hammering Twilio on every admin render
        next: { revalidate: 300 },
      }
    );

    if (!res.ok) throw new Error(`Twilio ${res.status}`);

    const data = await res.json();
    const contents: TwilioContentItem[] = data.contents || [];

    const allTemplateNames = contents.map(
      (c) => c.approval_requests?.name || c.friendly_name
    );

    const templates: SyncedTemplate[] = contents
      .filter(
        (c) =>
          c.approval_requests?.category?.toUpperCase() === "MARKETING" &&
          c.approval_requests?.status?.toLowerCase() === "approved"
      )
      .map((c) => {
        const local = getTemplateBySid(c.sid);
        const twilioBody =
          Object.values(c.types || {})
            .map((t) => t.body || t.title)
            .find(Boolean) || "";
        const twilioVarCount = Object.keys(c.variables || {}).length;

        return {
          label: local?.label ?? c.friendly_name,
          name: c.approval_requests?.name || c.friendly_name,
          contentSid: c.sid,
          variableCount: local?.variableCount ?? twilioVarCount,
          variableLabels: local?.variableLabels ?? [],
          autoNameVariable: local?.autoNameVariable ?? false,
          bodyPreview: local?.bodyPreview ?? twilioBody,
          category: "marketing" as const,
          broken: local?.broken,
          brokenReason: local?.brokenReason,
          approvalStatus: c.approval_requests?.status,
        };
      })
      .filter((t) => !t.broken);

    // Safety net: if Twilio returned nothing usable, keep the local registry
    if (templates.length === 0) {
      return NextResponse.json({
        source: "local",
        templates: localTemplates,
        allTemplateNames: localTemplates.map((t) => t.name),
      });
    }

    return NextResponse.json({ source: "twilio", templates, allTemplateNames });
  } catch (err) {
    console.error("[admin/templates] Twilio fetch failed, using local:", err);
    return NextResponse.json({
      source: "local",
      templates: localTemplates,
      allTemplateNames: localTemplates.map((t) => t.name),
    });
  }
}
