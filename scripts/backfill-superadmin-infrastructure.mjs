#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function readEnvFile() {
  const envPath = path.join(__dirname, "..", ".env.local");
  const envContent = fs.readFileSync(envPath, "utf-8");
  return Object.fromEntries(
    envContent
      .split("\n")
      .filter(Boolean)
      .map((line) => {
        const separatorIndex = line.indexOf("=");
        return [line.slice(0, separatorIndex), line.slice(separatorIndex + 1)];
      }),
  );
}

function getProjectRef(supabaseUrl) {
  const match = (supabaseUrl || "").match(/^https:\/\/([a-z0-9-]+)\.supabase\.co/i);
  return match?.[1] || null;
}

function normalizePublicUrl(hostname) {
  if (!hostname) return null;
  if (hostname.endsWith(".localhost") || hostname === "localhost") {
    return `http://${hostname}`;
  }
  return `https://${hostname}`;
}

async function main() {
  const env = readEnvFile();
  const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  const projectRef = getProjectRef(env.NEXT_PUBLIC_SUPABASE_URL);

  const { data: sites, error: sitesError } = await admin
    .from("sites")
    .select("id, tenant_id, metadata");

  if (sitesError) throw sitesError;

  const { data: domains, error: domainsError } = await admin
    .from("site_domains")
    .select("site_id, hostname, status, is_primary, kind")
    .is("removed_at", null);

  if (domainsError) throw domainsError;

  const primaryDomainBySite = new Map();
  for (const domain of domains || []) {
    if (domain.status !== "active") continue;
    const current = primaryDomainBySite.get(domain.site_id);
    if (!current || domain.is_primary || domain.kind === "platform_subdomain") {
      primaryDomainBySite.set(domain.site_id, domain.hostname);
    }
  }

  const summary = [];

  for (const site of sites || []) {
    const metadata = site.metadata || {};
    const infraConfig = metadata.infrastructure || {};
    const runtimeConfig = metadata.runtime || {};
    const stackKind = infraConfig.stack_kind === "dedicated" ? "dedicated" : "shared";
    const deployTargetKind = runtimeConfig.deploy_target_kind === "customer_vps" ? "customer_vps" : "vercel_managed";
    const domain = primaryDomainBySite.get(site.id) || null;
    const publicBaseUrl = runtimeConfig.public_base_url || normalizePublicUrl(domain);
    const deployTargetLabel =
      runtimeConfig.deploy_target_label ||
      (deployTargetKind === "customer_vps" ? "Customer VPS" : "Managed Vercel Runtime");

    const { error: infraError } = await admin
      .from("site_infrastructure")
      .upsert({
        site_id: site.id,
        tenant_id: site.tenant_id,
        stack_kind: stackKind,
        supabase_project_ref: projectRef,
        supabase_url: env.NEXT_PUBLIC_SUPABASE_URL,
        deploy_target_kind: deployTargetKind,
        deploy_target_label: deployTargetLabel,
        public_base_url: publicBaseUrl,
        media_storage_label: "supabase-shared",
        publish_strategy: "published-static-json",
        config: {
          source: "backfill-superadmin-infrastructure",
          media_strategy: "supabase-origin/published-runtime",
        },
      });

    if (infraError) throw infraError;

    const { data: existingTarget, error: existingTargetError } = await admin
      .from("deploy_targets")
      .select("id")
      .eq("site_id", site.id)
      .eq("is_active", true)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingTargetError) throw existingTargetError;

    const targetPayload = {
      site_id: site.id,
      tenant_id: site.tenant_id,
      kind: deployTargetKind,
      label: deployTargetLabel,
      hostname: domain,
      is_active: true,
      config: {
        source: "backfill-superadmin-infrastructure",
        public_base_url: publicBaseUrl,
      },
    };

    const targetResult = existingTarget?.id
      ? await admin.from("deploy_targets").update(targetPayload).eq("id", existingTarget.id)
      : await admin.from("deploy_targets").insert(targetPayload);

    if (targetResult.error) {
      throw targetResult.error;
    }

    summary.push({
      siteId: site.id,
      tenantId: site.tenant_id,
      stackKind,
      deployTargetKind,
      hostname: domain,
    });
  }

  console.log(JSON.stringify({ ok: true, count: summary.length, items: summary }, null, 2));
}

main().catch((error) => {
  console.error(`❌ ${error.message}`);
  process.exit(1);
});
