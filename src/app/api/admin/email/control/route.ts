import { NextRequest, NextResponse } from "next/server";
import { assertTrustedMutationRequest } from "@/lib/security/request";
import { requireSuperAdminApi } from "@/lib/superadmin/api";
import {
  mergeSiteTransactionalEmailConfigIntoInfrastructure,
  normalizePlatformTransactionalEmailConfig,
  normalizeSiteTransactionalEmailConfig,
  PLATFORM_EMAIL_CONTROL_AUDIT_ACTION,
  readLatestPlatformTransactionalEmailConfig,
  readSiteTransactionalEmailConfigFromInfrastructure,
  resolveEffectiveTransactionalSender,
} from "@/lib/email/control-plane";

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function GET() {
  const access = await requireSuperAdminApi();
  if ("error" in access) return access.error;

  const { serviceClient } = access;
  const [platformConfig, sitesRes, membershipsRes, infraRes, usersRes] = await Promise.all([
    readLatestPlatformTransactionalEmailConfig(serviceClient),
    serviceClient
      .from("sites")
      .select("id, tenant_id, name, slug, status")
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
    serviceClient
      .from("tenant_memberships")
      .select("site_id")
      .is("revoked_at", null),
    serviceClient
      .from("site_infrastructure")
      .select("site_id, config"),
    serviceClient
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .is("deleted_at", null),
  ]);

  const memberCountBySite = new Map<string, number>();
  for (const membership of membershipsRes.data || []) {
    memberCountBySite.set(membership.site_id, (memberCountBySite.get(membership.site_id) || 0) + 1);
  }

  const infrastructureBySite = new Map(
    (infraRes.data || []).map((row) => [row.site_id, row.config || {}]),
  );

  const sites = (sitesRes.data || []).map((site) => {
    const siteConfig = readSiteTransactionalEmailConfigFromInfrastructure(infrastructureBySite.get(site.id));
    const effective = resolveEffectiveTransactionalSender({
      siteName: site.name,
      platform: platformConfig,
      site: siteConfig,
    });

    return {
      siteId: site.id,
      tenantId: site.tenant_id,
      name: site.name,
      slug: site.slug,
      status: site.status,
      memberCount: memberCountBySite.get(site.id) || 0,
      sender: siteConfig,
      effectiveSender: effective,
    };
  });

  return NextResponse.json({
    platformConfig,
    transport: {
      mode: process.env.EMAIL_TRANSPORT === "resend"
        ? "resend"
        : process.env.SMTP_HOST
          ? "smtp"
          : "console",
      resendConfigured: Boolean(process.env.RESEND_API_KEY),
    },
    newsletterPolicy: {
      provider: platformConfig.newsletterProvider,
      deliveryModel: "external_provider",
    },
    counts: {
      users: usersRes.count || 0,
      sites: sites.length,
    },
    sites,
  });
}

export async function PUT(request: NextRequest) {
  const trustedOriginError = assertTrustedMutationRequest(request);
  if (trustedOriginError) return trustedOriginError;

  const access = await requireSuperAdminApi();
  if ("error" in access) return access.error;

  const body = await request.json().catch(() => null);
  const scope = asString(body?.scope);
  const { user, serviceClient } = access;

  if (scope === "platform") {
    const platformConfig = normalizePlatformTransactionalEmailConfig(body?.platformConfig);

    const { error } = await serviceClient.from("audit_logs").insert({
      action: PLATFORM_EMAIL_CONTROL_AUDIT_ACTION,
      actor_id: user.id,
      resource_type: "platform_email",
      resource_id: "default",
      metadata: platformConfig,
    });

    if (error) {
      return NextResponse.json({ error: error.message || "Failed to save platform email config" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, platformConfig });
  }

  if (scope === "site") {
    const siteId = asString(body?.siteId);
    if (!siteId) {
      return NextResponse.json({ error: "siteId required" }, { status: 400 });
    }

    const sender = normalizeSiteTransactionalEmailConfig(body?.sender);
    const [{ data: site }, { data: currentInfra }] = await Promise.all([
      serviceClient
        .from("sites")
        .select("id, tenant_id, name")
        .eq("id", siteId)
        .maybeSingle(),
      serviceClient
        .from("site_infrastructure")
        .select("site_id, tenant_id, config")
        .eq("site_id", siteId)
        .maybeSingle(),
    ]);

    if (!site?.id) {
      return NextResponse.json({ error: "Site not found" }, { status: 404 });
    }

    const nextConfig = mergeSiteTransactionalEmailConfigIntoInfrastructure(currentInfra?.config, sender);
    const payload = {
      site_id: site.id,
      tenant_id: site.tenant_id,
      config: nextConfig,
    };

    const { error } = await serviceClient
      .from("site_infrastructure")
      .upsert(payload, { onConflict: "site_id" });

    if (error) {
      return NextResponse.json({ error: error.message || "Failed to save site sender" }, { status: 500 });
    }

    await serviceClient.from("audit_logs").insert({
      action: "platform.email.site-sender.update",
      actor_id: user.id,
      resource_type: "site_infrastructure",
      resource_id: site.id,
      metadata: {
        siteId: site.id,
        tenantId: site.tenant_id,
        senderMode: sender.senderMode,
        fromEmail: sender.fromEmail,
        replyTo: sender.replyTo,
        senderDomain: sender.senderDomain,
      },
    });

    return NextResponse.json({ ok: true, siteId: site.id, sender });
  }

  return NextResponse.json({ error: "Unsupported scope" }, { status: 400 });
}
