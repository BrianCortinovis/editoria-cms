import { NextResponse } from "next/server";
import { assertTrustedMutationRequest } from "@/lib/security/request";
import { writeActivityLog } from "@/lib/security/audit";
import { triggerPublish } from "@/lib/publish/runner";
import { assertCmsRateLimit, CMS_EDITOR_ROLES, requireTenantAccess } from "@/lib/cms/tenant-access";
import { assertSiteUploadAllowed } from "@/lib/superadmin/storage";
import { shouldUseR2, getR2CredentialsForTenant, uploadToR2 } from "@/lib/storage/r2-client";

const MAX_UPLOAD_SIZE_BYTES = 50 * 1024 * 1024;
const ALLOWED_MEDIA_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "audio/mpeg",
  "audio/mp3",
  "audio/mp4",
  "audio/x-m4a",
  "audio/wav",
  "audio/webm",
  "audio/ogg",
  "application/pdf",
]);
const ALLOWED_MEDIA_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp", "gif", "mp4", "webm", "mov", "mp3", "m4a", "wav", "ogg", "pdf"]);

const MEDIA_TYPE_FOLDERS: Record<string, string> = {
  "image/jpeg": "images",
  "image/png": "images",
  "image/webp": "images",
  "image/gif": "images",
  "video/mp4": "video",
  "video/webm": "video",
  "video/quicktime": "video",
  "audio/mpeg": "audio",
  "audio/mp3": "audio",
  "audio/mp4": "audio",
  "audio/x-m4a": "audio",
  "audio/wav": "audio",
  "audio/webm": "audio",
  "audio/ogg": "audio",
  "application/pdf": "documents",
};

/**
 * Build organized storage path:
 * {tenant-slug}/{type}/{YYYY}/{MM}/{slugified-name}-{hash}.{ext}
 */
function buildMediaPath(tenantSlug: string, originalName: string, mimeType: string, ext: string): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const typeFolder = MEDIA_TYPE_FOLDERS[mimeType] || "other";

  // Slugify the original filename (without extension)
  const baseName = originalName
    .replace(/\.[^.]+$/, "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "file";

  const hash = crypto.randomUUID().slice(0, 8);
  return `${tenantSlug}/${typeFolder}/${year}/${month}/${baseName}-${hash}.${ext}`;
}

export async function POST(request: Request) {
  const trustedOriginError = assertTrustedMutationRequest(request);
  if (trustedOriginError) {
    return trustedOriginError;
  }

  const rateLimitError = await assertCmsRateLimit(request, "cms-media-upload", 20, 10 * 60 * 1000);
  if (rateLimitError) {
    return rateLimitError;
  }

  const formData = await request.formData();
  const tenantId = String(formData.get("tenant_id") || "").trim();
  const tenantSlug = String(formData.get("tenant_slug") || "").trim();
  const file = formData.get("file");

  if (!tenantId || !tenantSlug || !(file instanceof File)) {
    return NextResponse.json({ error: "tenant_id, tenant_slug and file are required" }, { status: 400 });
  }

  const access = await requireTenantAccess(tenantId, CMS_EDITOR_ROLES);
  if ("error" in access) {
    return access.error;
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "";
  if (!ALLOWED_MEDIA_MIME_TYPES.has(file.type) || !ALLOWED_MEDIA_EXTENSIONS.has(ext)) {
    return NextResponse.json({ error: "Unsupported media type" }, { status: 400 });
  }
  if (file.size > MAX_UPLOAD_SIZE_BYTES) {
    return NextResponse.json({ error: "File exceeds 50MB limit" }, { status: 400 });
  }
  if (file.type === "image/svg+xml" || ext === "svg" || ext === "html" || ext === "htm") {
    return NextResponse.json({ error: "Unsafe file format" }, { status: 400 });
  }

  const quotaCheck = await assertSiteUploadAllowed(tenantId, file.size, access.serviceClient);
  if (!quotaCheck.allowed) {
    if (quotaCheck.quota?.uploadBlocked) {
      return NextResponse.json({ error: "Uploads blocked by superadmin policy for this site" }, { status: 403 });
    }

    if (quotaCheck.exceedsHard) {
      return NextResponse.json(
        {
          error: "Site storage hard limit exceeded",
          usageBytes: quotaCheck.usageBytes,
          hardLimitBytes: quotaCheck.quota?.hardLimitBytes ?? null,
        },
        { status: 413 },
      );
    }
  }

  const storagePath = buildMediaPath(tenantSlug, file.name, file.type, ext);
  const bytes = await file.arrayBuffer();
  const uploadBuffer = Buffer.from(bytes);

  let publicUrl: string;
  const useR2 = await shouldUseR2(tenantId);

  if (useR2) {
    const r2Creds = await getR2CredentialsForTenant(tenantId);
    if (!r2Creds) {
      return NextResponse.json({ error: "R2 configured but credentials missing" }, { status: 500 });
    }

    try {
      const result = await uploadToR2(r2Creds, storagePath, uploadBuffer, file.type);
      publicUrl = result.url;
    } catch (r2Error) {
      return NextResponse.json({
        error: r2Error instanceof Error ? r2Error.message : "R2 upload failed",
      }, { status: 500 });
    }
  } else {
    const uploadResult = await access.serviceClient.storage
      .from("media")
      .upload(storagePath, uploadBuffer, {
        contentType: file.type,
        cacheControl: "public, max-age=31536000, immutable",
        upsert: false,
      });

    if (uploadResult.error) {
      return NextResponse.json({ error: uploadResult.error.message }, { status: 500 });
    }

    const { data: urlData } = access.serviceClient.storage.from("media").getPublicUrl(storagePath);
    publicUrl = urlData.publicUrl;
  }
  const { data: inserted, error: insertError } = await access.sessionClient
    .from("media")
    .insert({
      tenant_id: tenantId,
      filename: storagePath,
      original_filename: file.name,
      mime_type: file.type,
      size_bytes: file.size,
      width: null,
      height: null,
      url: publicUrl,
      thumbnail_url: file.type.startsWith("image/") ? publicUrl : null,
      uploaded_by: access.user.id,
    })
    .select("*")
    .single();

  if (insertError || !inserted) {
    await access.serviceClient.storage.from("media").remove([storagePath]);
    return NextResponse.json({ error: insertError?.message || "Unable to persist media record" }, { status: 500 });
  }

  await writeActivityLog({
    tenantId,
    userId: access.user.id,
    action: "media.upload",
    entityType: "media",
    entityId: inserted.id,
    details: {
      filename: inserted.original_filename,
      mimeType: inserted.mime_type,
      sizeBytes: inserted.size_bytes,
    },
  });

  await triggerPublish(tenantId, [{ type: "full_rebuild" }], access.user.id);

  return NextResponse.json({ media: inserted });
}
