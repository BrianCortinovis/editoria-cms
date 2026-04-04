import { NextRequest, NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { assertTrustedMutationRequest } from "@/lib/security/request";
import { requireSuperAdminApi } from "@/lib/superadmin/api";
import {
  readLatestPlatformTransactionalEmailConfig,
  readSiteTransactionalEmailConfigFromInfrastructure,
  resolveEffectiveTransactionalSender,
} from "@/lib/email/control-plane";
import { sendBulkEmail } from "@/lib/email/service";
import type { Database } from "@/types/database";

type AudienceMode = "platform_users" | "site_members" | "custom_emails";

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

interface ProfileEmailRow {
  id: string;
  email: string | null;
}

interface MembershipProfileRow {
  profiles: { email?: string | null } | Array<{ email?: string | null }> | null;
}

async function resolveRecipients(
  serviceClient: SupabaseClient<Database>,
  mode: AudienceMode,
  body: Record<string, unknown>,
) {
  if (mode === "custom_emails") {
    const rawEmails = Array.isArray(body.emails) ? body.emails : [];
    return uniqueEmails(rawEmails.map((value) => String(value || "")));
  }

  if (mode === "platform_users") {
    const selectedUserIds = Array.isArray(body.userIds) ? body.userIds.map((value) => String(value)) : [];
    const query = serviceClient
      .from("profiles")
      .select("id, email")
      .is("deleted_at", null);

    const response = selectedUserIds.length > 0
      ? await query.in("id", selectedUserIds)
      : await query;

    return uniqueEmails(((response.data || []) as ProfileEmailRow[]).map((profile) => profile.email || ""));
  }

  const siteId = asString(body.siteId);
  if (!siteId) {
    throw new Error("siteId required for site_members audience");
  }

  const { data } = await serviceClient
    .from("tenant_memberships")
    .select("profiles(email)")
    .eq("site_id", siteId)
    .is("revoked_at", null);

  return uniqueEmails(
    ((data || []) as MembershipProfileRow[]).map((row) => {
      const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
      return profile && typeof profile === "object" && "email" in profile ? String(profile.email || "") : "";
    }),
  );
}

export async function POST(request: NextRequest) {
  const trustedOriginError = assertTrustedMutationRequest(request);
  if (trustedOriginError) return trustedOriginError;

  const access = await requireSuperAdminApi();
  if ("error" in access) return access.error;

  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const audience = asString(body?.audience) as AudienceMode;
  const subject = asString(body?.subject);
  const messageText = asString(body?.messageText);
  const siteId = asString(body?.siteId);

  if (!["platform_users", "site_members", "custom_emails"].includes(audience)) {
    return NextResponse.json({ error: "Valid audience required" }, { status: 400 });
  }

  if (!subject || !messageText) {
    return NextResponse.json({ error: "subject and messageText required" }, { status: 400 });
  }

  const { user, serviceClient } = access;

  let recipients: string[];
  try {
    recipients = await resolveRecipients(serviceClient, audience, body || {});
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to resolve recipients";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  if (recipients.length === 0) {
    return NextResponse.json({ error: "No recipients resolved" }, { status: 400 });
  }

  const platformConfig = await readLatestPlatformTransactionalEmailConfig(serviceClient);
  let sender = resolveEffectiveTransactionalSender({
    siteName: null,
    platform: platformConfig,
    site: readSiteTransactionalEmailConfigFromInfrastructure(null),
  });

  if (siteId) {
    const [{ data: site }, { data: infrastructure }] = await Promise.all([
      serviceClient.from("sites").select("id, name").eq("id", siteId).maybeSingle(),
      serviceClient.from("site_infrastructure").select("config").eq("site_id", siteId).maybeSingle(),
    ]);

    if (!site?.id) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }

    sender = resolveEffectiveTransactionalSender({
      siteName: site.name,
      platform: platformConfig,
      site: readSiteTransactionalEmailConfigFromInfrastructure(infrastructure?.config),
    });
  }

  if (!sender.fromEmail) {
    return NextResponse.json(
      { error: "Configura prima un sender email valido nel control panel" },
      { status: 400 },
    );
  }

  const html = asString(body?.messageHtml) || textToHtml(messageText);
  const result = await sendBulkEmail(
    {
      to: recipients,
      subject,
      html,
      text: messageText,
      from: sender.fromName ? `${sender.fromName} <${sender.fromEmail}>` : sender.fromEmail,
      replyTo: sender.replyTo || undefined,
    },
    { concurrency: 4 },
  );

  await serviceClient.from("audit_logs").insert({
    action: "platform.email.broadcast.send",
    actor_id: user.id,
    resource_type: "platform_email",
    resource_id: siteId || "platform",
    metadata: {
      audience,
      siteId: siteId || null,
      subject,
      requestedRecipients: recipients.length,
      sent: result.sent,
      failed: result.failed,
      fromEmail: sender.fromEmail,
      senderSource: sender.source,
      newsletterProvider: platformConfig.newsletterProvider,
    },
  });

  return NextResponse.json({
    ok: true,
    sender,
    audience,
    totalRecipients: recipients.length,
    sent: result.sent,
    failed: result.failed,
    failures: result.failures.slice(0, 20),
  });
}
