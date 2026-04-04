import { NextRequest, NextResponse } from "next/server";
import { assertTrustedMutationRequest } from "@/lib/security/request";
import { CMS_CONFIG_ROLES, requireTenantAccess } from "@/lib/cms/tenant-access";
import {
  readLatestPlatformTransactionalEmailConfig,
  readSiteTransactionalEmailConfigFromInfrastructure,
  resolveEffectiveTransactionalSender,
} from "@/lib/email/control-plane";
import { sendBulkEmail } from "@/lib/email/service";
import { writeActivityLog } from "@/lib/security/audit";

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function uniqueEmails(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim().toLowerCase()).filter(Boolean)));
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function textToHtml(value: string) {
  const paragraphs = value
    .split(/\n{2,}/)
    .map((chunk) => chunk.trim())
    .filter(Boolean);

  return `<!doctype html><html lang="it"><body style="margin:0;padding:24px;background:#f5f5f5;font-family:Arial,sans-serif;color:#111827;"><div style="max-width:680px;margin:0 auto;background:#ffffff;border-radius:18px;padding:32px;">${paragraphs
    .map((paragraph) => `<p style="margin:0 0 16px;font-size:15px;line-height:1.7;">${escapeHtml(paragraph).replace(/\n/g, "<br />")}</p>`)
    .join("")}</div></body></html>`;
}

export async function POST(request: NextRequest) {
  const trustedOriginError = assertTrustedMutationRequest(request);
  if (trustedOriginError) return trustedOriginError;

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const tenantId = asString(body?.tenant_id);
  const audience = asString(body?.audience);
  const subject = asString(body?.subject);
  const messageText = asString(body?.messageText);

  if (!tenantId || !subject || !messageText) {
    return NextResponse.json({ error: "tenant_id, subject e messageText sono obbligatori" }, { status: 400 });
  }

  if (!["site_members", "custom_emails"].includes(audience)) {
    return NextResponse.json({ error: "Audience non valida" }, { status: 400 });
  }

  const access = await requireTenantAccess(tenantId, CMS_CONFIG_ROLES);
  if ("error" in access) return access.error;

  const { platformServiceClient, user } = access;
  const [{ data: site }, platformConfig] = await Promise.all([
    platformServiceClient
      .from("sites")
      .select("id, name")
      .eq("tenant_id", tenantId)
      .maybeSingle(),
    readLatestPlatformTransactionalEmailConfig(platformServiceClient),
  ]);

  if (!site?.id) {
    return NextResponse.json({ error: "Sito non trovato per questo tenant" }, { status: 404 });
  }

  const { data: infrastructure } = await platformServiceClient
    .from("site_infrastructure")
    .select("config")
    .eq("site_id", site.id)
    .maybeSingle();

  const sender = resolveEffectiveTransactionalSender({
    siteName: site.name,
    platform: platformConfig,
    site: readSiteTransactionalEmailConfigFromInfrastructure(infrastructure?.config),
  });

  if (!sender.fromEmail) {
    return NextResponse.json({ error: "Sender email non configurato. Chiedi al superadmin di impostare il dominio mittente." }, { status: 400 });
  }

  let recipients: string[] = [];
  if (audience === "site_members") {
    const { data } = await platformServiceClient
      .from("tenant_memberships")
      .select("profiles(email)")
      .eq("tenant_id", tenantId)
      .is("revoked_at", null);

    recipients = uniqueEmails(
      (data || []).map((row) => {
        const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
        return profile && typeof profile === "object" && "email" in profile ? String(profile.email || "") : "";
      }),
    );
  } else {
    recipients = uniqueEmails(
      (Array.isArray(body?.emails) ? body?.emails : []).map((value) => String(value || "")),
    );
  }

  if (recipients.length === 0) {
    return NextResponse.json({ error: "Nessun destinatario disponibile" }, { status: 400 });
  }

  const result = await sendBulkEmail({
    to: recipients,
    subject,
    html: textToHtml(messageText),
    text: messageText,
    from: sender.fromName ? `${sender.fromName} <${sender.fromEmail}>` : sender.fromEmail,
    replyTo: sender.replyTo || undefined,
  });

  await writeActivityLog({
    tenantId,
    userId: user.id,
    action: "cms.email.send",
    entityType: "site_email",
    entityId: site.id,
    details: {
      audience,
      recipients: recipients.length,
      sent: result.sent,
      failed: result.failed,
      fromEmail: sender.fromEmail,
      senderSource: sender.source,
    },
  });

  return NextResponse.json({
    ok: true,
    sent: result.sent,
    failed: result.failed,
    totalRecipients: recipients.length,
    sender,
    failures: result.failures.slice(0, 20),
  });
}
