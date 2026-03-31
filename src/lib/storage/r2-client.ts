import { createServiceRoleClient } from "@/lib/supabase/server";
import { getSiteStorageQuotaByTenantId } from "@/lib/superadmin/storage";

interface R2Credentials {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  publicUrl: string;
}

/**
 * Load platform-level R2 config from audit_logs
 */
async function getPlatformR2Config(): Promise<R2Credentials | null> {
  const client = await createServiceRoleClient();
  const { data } = await client
    .from("audit_logs")
    .select("metadata")
    .eq("action", "platform.r2.config")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data?.metadata) return null;
  const m = data.metadata as Record<string, unknown>;
  if (!m.accountId || !m.accessKeyId || !m.secretAccessKey || !m.bucketName) return null;

  return {
    accountId: String(m.accountId),
    accessKeyId: String(m.accessKeyId),
    secretAccessKey: String(m.secretAccessKey),
    bucketName: String(m.bucketName),
    publicUrl: String(m.publicUrl || ""),
  };
}

/**
 * Get R2 credentials for a tenant.
 * If the tenant has dedicated R2 config → use that.
 * Otherwise → use the platform shared R2.
 */
export async function getR2CredentialsForTenant(tenantId: string): Promise<R2Credentials | null> {
  const quota = await getSiteStorageQuotaByTenantId(tenantId);

  // Check if tenant has dedicated R2 config
  if (quota?.config) {
    const c = quota.config as Record<string, unknown>;
    if (c.r2_account_id && c.r2_access_key_id && c.r2_secret_access_key && c.r2_bucket_name) {
      return {
        accountId: String(c.r2_account_id),
        accessKeyId: String(c.r2_access_key_id),
        secretAccessKey: String(c.r2_secret_access_key),
        bucketName: String(c.r2_bucket_name),
        publicUrl: String(c.r2_public_url || ""),
      };
    }
  }

  // Fallback to platform R2
  return getPlatformR2Config();
}

/**
 * Upload a file to Cloudflare R2 using S3-compatible API
 */
export async function uploadToR2(
  credentials: R2Credentials,
  key: string,
  body: Buffer,
  contentType: string,
): Promise<{ url: string }> {
  const r2Host = `${credentials.accountId}.eu.r2.cloudflarestorage.com`;
  const url = `https://${r2Host}/${credentials.bucketName}/${key}`;

  // S3-compatible PUT with AWS Signature V4
  const { SignatureV4 } = await import("@smithy/signature-v4");
  const { Sha256 } = await import("@aws-crypto/sha256-js");

  const signer = new SignatureV4({
    service: "s3",
    region: "auto",
    credentials: {
      accessKeyId: credentials.accessKeyId,
      secretAccessKey: credentials.secretAccessKey,
    },
    sha256: Sha256,
  });

  const request = {
    method: "PUT",
    protocol: "https:",
    hostname: `${credentials.accountId}.eu.r2.cloudflarestorage.com`,
    path: `/${credentials.bucketName}/${key}`,
    headers: {
      "Content-Type": contentType,
      "Content-Length": String(body.length),
      "Cache-Control": "public, max-age=31536000, immutable",
      host: `${credentials.accountId}.eu.r2.cloudflarestorage.com`,
    },
    body,
  };

  const signed = await signer.sign(request);

  const response = await fetch(url, {
    method: "PUT",
    headers: signed.headers as Record<string, string>,
    body: new Uint8Array(body),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`R2 upload failed (${response.status}): ${text}`);
  }

  // Build public URL
  const publicUrl = credentials.publicUrl
    ? `${credentials.publicUrl.replace(/\/$/, "")}/${key}`
    : `https://${r2Host}/${credentials.bucketName}/${key}`;

  return { url: publicUrl };
}

/**
 * Check if a tenant should use R2 for uploads.
 * Default for all sites is R2 (platform shared).
 * Enterprise sites can override to supabase or customer_vps_local.
 */
export async function shouldUseR2(tenantId: string): Promise<boolean> {
  const quota = await getSiteStorageQuotaByTenantId(tenantId);
  // No quota configured = base site = always R2
  if (!quota) return true;
  // Enterprise with explicit provider choice
  return quota.mediaProvider === "cloudflare_r2";
}
