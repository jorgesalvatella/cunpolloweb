import { NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { sendWhatsAppTemplate } from "@/lib/twilio";

export async function GET() {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("campaigns")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: "Error al obtener campanas" }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: Request) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const body = await request.json();
  const { templateName, contentSid, messagePreview, contentVariables, contactIds } = body;

  if (!templateName || !contentSid || !messagePreview) {
    return NextResponse.json(
      { error: "templateName, contentSid y messagePreview son requeridos" },
      { status: 400 }
    );
  }

  const supabase = getSupabaseAdmin();

  // Get contacts to send to (only active + opted-in for marketing)
  let query = supabase
    .from("contacts")
    .select("*")
    .eq("active", true)
    .eq("opted_in_marketing", true);

  if (contactIds && contactIds.length > 0) {
    query = query.in("id", contactIds);
  }

  const { data: contacts, error: contactsError } = await query;

  if (contactsError || !contacts) {
    return NextResponse.json({ error: "Error al obtener contactos" }, { status: 500 });
  }

  if (contacts.length === 0) {
    return NextResponse.json({ error: "No hay contactos activos" }, { status: 400 });
  }

  // Create campaign record
  const { data: campaign, error: campaignError } = await supabase
    .from("campaigns")
    .insert({
      template_name: templateName,
      message_preview: messagePreview,
      recipients_count: contacts.length,
      status: "sending",
    })
    .select()
    .single();

  if (campaignError || !campaign) {
    return NextResponse.json({ error: "Error al crear campana" }, { status: 500 });
  }

  // Send messages
  let sentCount = 0;
  let failedCount = 0;
  const errors: string[] = [];

  for (const contact of contacts) {
    // Auto-set {{1}} to contact name, merge with any extra variables
    const vars = { "1": contact.name, ...contentVariables };
    const result = await sendWhatsAppTemplate(
      contact.phone,
      contentSid,
      vars
    );

    if (result.success) {
      sentCount++;
    } else {
      failedCount++;
      // Log full details server-side, but don't expose phone numbers in response
      console.error(`[Campaign ${campaign.id}] ${contact.phone}: ${result.error}`);
      errors.push(result.error || "Error de envio");
    }
  }

  // Update campaign stats
  const finalStatus = failedCount === contacts.length ? "failed" : "completed";
  await supabase
    .from("campaigns")
    .update({
      sent_count: sentCount,
      failed_count: failedCount,
      status: finalStatus,
      error_details: errors.length > 0 ? errors.join("\n") : null,
    })
    .eq("id", campaign.id);

  return NextResponse.json({
    id: campaign.id,
    sent: sentCount,
    failed: failedCount,
    status: finalStatus,
    errors: errors.length > 0 ? errors : undefined,
  });
}
