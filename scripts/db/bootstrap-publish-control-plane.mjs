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

function createVersionLabel(date = new Date()) {
  const parts = [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0"),
    String(date.getUTCHours()).padStart(2, "0"),
    String(date.getUTCMinutes()).padStart(2, "0"),
  ];

  return `bootstrap-${parts.join("")}`;
}

async function main() {
  const env = readEnvFile();
  const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

  const [{ data: sites, error: sitesError }, { data: domains, error: domainsError }] = await Promise.all([
    admin.from("sites").select("id, tenant_id, slug, name, owner_user_id").is("deleted_at", null),
    admin
      .from("site_domains")
      .select("site_id, hostname, is_primary, kind, status")
      .is("removed_at", null)
      .eq("status", "active"),
  ]);

  if (sitesError) throw sitesError;
  if (domainsError) throw domainsError;

  const primaryDomainBySite = new Map();
  for (const domain of domains || []) {
    if (!primaryDomainBySite.has(domain.site_id) || domain.is_primary || domain.kind === "platform_subdomain") {
      primaryDomainBySite.set(domain.site_id, domain.hostname);
    }
  }

  const summary = [];
  const now = new Date();

  for (const site of sites || []) {
    const { data: existingRelease, error: existingReleaseError } = await admin
      .from("publish_releases")
      .select("id, version_label, created_at")
      .eq("site_id", site.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingReleaseError) throw existingReleaseError;

    let releaseId = existingRelease?.id ?? null;
    let releaseVersion = existingRelease?.version_label ?? null;
    const domain = primaryDomainBySite.get(site.id) || `${site.slug}.localhost`;
    const manifestPath = `/published/${site.slug}/manifest.json`;

    if (!existingRelease) {
      const versionLabel = createVersionLabel(now);
      const { data: createdRelease, error: createReleaseError } = await admin
        .from("publish_releases")
        .insert({
          site_id: site.id,
          tenant_id: site.tenant_id,
          version_label: versionLabel,
          status: "active",
          manifest_path: manifestPath,
          payload_checksum: `${site.id}:${versionLabel}`,
          created_by: site.owner_user_id,
          activated_at: now.toISOString(),
          metadata: {
            source: "bootstrap-publish-control-plane",
            public_domain: domain,
            strategy: "published-static-json",
          },
        })
        .select("id, version_label")
        .single();

      if (createReleaseError || !createdRelease) {
        throw createReleaseError || new Error("Unable to create publish release");
      }

      releaseId = createdRelease.id;
      releaseVersion = createdRelease.version_label;
    }

    const { data: existingJob, error: existingJobError } = await admin
      .from("publish_jobs")
      .select("id")
      .eq("site_id", site.id)
      .eq("job_type", "bootstrap_publish_state")
      .limit(1)
      .maybeSingle();

    if (existingJobError) throw existingJobError;

    if (!existingJob) {
      const { error: createJobError } = await admin
        .from("publish_jobs")
        .insert({
          site_id: site.id,
          tenant_id: site.tenant_id,
          release_id: releaseId,
          job_type: "bootstrap_publish_state",
          status: "succeeded",
          started_at: now.toISOString(),
          finished_at: now.toISOString(),
          metadata: {
            source: "bootstrap-publish-control-plane",
            note: "Initial publish state created from existing site data",
          },
        });

      if (createJobError) {
        throw createJobError;
      }
    }

    const { error: infraError } = await admin
      .from("site_infrastructure")
      .update({
        last_publish_at: now.toISOString(),
      })
      .eq("site_id", site.id);

    if (infraError) {
      throw infraError;
    }

    summary.push({
      siteId: site.id,
      tenantId: site.tenant_id,
      releaseVersion,
      domain,
      manifestPath,
    });
  }

  console.log(JSON.stringify({ ok: true, count: summary.length, items: summary }, null, 2));
}

main().catch((error) => {
  console.error(`❌ ${error.message}`);
  process.exit(1);
});
