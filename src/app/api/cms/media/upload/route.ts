import { NextResponse } from "next/server";
import { assertTrustedMutationRequest } from "@/lib/security/request";
import { writeActivityLog } from "@/lib/security/audit";
import { triggerPublish } from "@/lib/publish/runner";
import { assertCmsRateLimit, CMS_EDITOR_ROLES, requireTenantAccess } from "@/lib/cms/tenant-access";
import { assertSiteUploadAllowed } from "@/lib/superadmin/storage";

const MAX_UPLOAD_SIZE_BYTES = 50 * 1024 * 1024;
const ALLOWED_MEDIA_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/webm",
  "application/pdf",
]);
const ALLOWED_MEDIA_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp", "gif", "mp4", "webm", "pdf"]);

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

  const filename = `${tenantSlug}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
  const bytes = await file.arrayBuffer();
  const uploadBuffer = Buffer.from(bytes);

  const uploadResult = await access.serviceClient.storage
    .from("media")
    .upload(filename, uploadBuffer, {
      contentType: file.type,
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadResult.error) {
    return NextResponse.json({ error: uploadResult.error.message }, { status: 500 });
  }

  const { data: urlData } = access.serviceClient.storage.from("media").getPublicUrl(filename);
  const { data: inserted, error: insertError } = await access.sessionClient
    .from("media")
    .insert({
      tenant_id: tenantId,
      filename,
      original_filename: file.name,
      mime_type: file.type,
      size_bytes: file.size,
      width: null,
      height: null,
      url: urlData.publicUrl,
      thumbnail_url: file.type.startsWith("image/") ? urlData.publicUrl : null,
      uploaded_by: access.user.id,
    })
    .select("*")
    .single();

  if (insertError || !inserted) {
    await access.serviceClient.storage.from("media").remove([filename]);
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
