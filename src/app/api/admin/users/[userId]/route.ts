import { NextResponse } from "next/server";
import { assertTrustedMutationRequest } from "@/lib/security/request";
import { requireSuperAdminApi } from "@/lib/superadmin/api";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<unknown> },
) {
  const trustedOriginError = assertTrustedMutationRequest(request);
  if (trustedOriginError) return trustedOriginError;

  const access = await requireSuperAdminApi();
  if ("error" in access) return access.error;

  const { userId } = (await params) as { userId: string };
  const body = await request.json().catch(() => null);

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Body richiesto" }, { status: 400 });
  }

  // Validate that the user exists
  const { data: profile, error: fetchError } = await access.serviceClient
    .from("profiles")
    .select("id, email, full_name, ai_enabled")
    .eq("id", userId)
    .is("deleted_at", null)
    .maybeSingle();

  if (fetchError || !profile) {
    return NextResponse.json(
      { error: fetchError?.message || "Utente non trovato" },
      { status: 404 },
    );
  }

  // Build the update payload (only allowed fields)
  const updatePayload: Record<string, unknown> = {};

  if ("ai_enabled" in body) {
    updatePayload.ai_enabled = Boolean(body.ai_enabled);
  }

  if (Object.keys(updatePayload).length === 0) {
    return NextResponse.json(
      { error: "Nessun campo da aggiornare" },
      { status: 400 },
    );
  }

  const { data: updated, error: updateError } = await access.serviceClient
    .from("profiles")
    .update(updatePayload)
    .eq("id", userId)
    .select("id, email, full_name, ai_enabled")
    .single();

  if (updateError || !updated) {
    return NextResponse.json(
      { error: updateError?.message || "Errore aggiornamento utente" },
      { status: 500 },
    );
  }

  // Audit log
  await access.serviceClient
    .from("audit_logs")
    .insert({
      tenant_id: null,
      actor_user_id: access.user.id,
      action: "platform.user_settings_updated",
      resource_type: "profile",
      resource_id: userId,
      metadata: { changes: updatePayload },
    })
    .maybeSingle();

  return NextResponse.json({ profile: updated });
}
