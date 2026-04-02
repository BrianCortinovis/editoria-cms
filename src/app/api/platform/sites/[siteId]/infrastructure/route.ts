import { NextResponse } from "next/server";
import { PlatformAuthorizationError } from "@/lib/platform/authorization";
import { updateSiteInfrastructureForCurrentUser } from "@/lib/platform/infrastructure-service";
import type { DeploymentTargetKind, InfrastructureStackKind } from "@/types/database";

function asString(value: unknown) {
  return value === null || value === undefined ? "" : String(value);
}

function normalizeStackKind(value: unknown): InfrastructureStackKind {
  return value === "dedicated" ? "dedicated" : "shared";
}

function normalizeDeployTargetKind(value: unknown): DeploymentTargetKind {
  if (value === "customer_vps" || value === "static_bundle") {
    return value;
  }
  return "vercel_managed";
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ siteId: string }> },
) {
  try {
    const { siteId } = await params;
    const body = await request.json();

    const infrastructure = await updateSiteInfrastructureForCurrentUser(siteId, {
      stackKind: normalizeStackKind(body.stackKind),
      deployTargetKind: normalizeDeployTargetKind(body.deployTargetKind),
      deployTargetLabel: asString(body.deployTargetLabel),
      publicBaseUrl: asString(body.publicBaseUrl),
      mediaStorageLabel: asString(body.mediaStorageLabel),
      publishStrategy: asString(body.publishStrategy || "published-static-json"),
      supabaseProjectRef: asString(body.supabaseProjectRef),
      supabaseUrl: asString(body.supabaseUrl),
      supabaseAnonKey: asString(body.supabaseAnonKey),
      supabaseServiceRoleKey: asString(body.supabaseServiceRoleKey),
      vercel: {
        projectId: asString(body.vercel?.projectId),
        teamId: asString(body.vercel?.teamId),
        token: asString(body.vercel?.token),
        productionDomain: asString(body.vercel?.productionDomain),
      },
      r2: {
        accountId: asString(body.r2?.accountId),
        accessKeyId: asString(body.r2?.accessKeyId),
        secretAccessKey: asString(body.r2?.secretAccessKey),
        bucketName: asString(body.r2?.bucketName),
        publicUrl: asString(body.r2?.publicUrl),
      },
      newsletter: {
        provider: body.newsletter?.provider,
        apiKey: asString(body.newsletter?.apiKey),
        apiBaseUrl: asString(body.newsletter?.apiBaseUrl),
        listId: asString(body.newsletter?.listId),
        senderEmail: asString(body.newsletter?.senderEmail),
        webhookUrl: asString(body.newsletter?.webhookUrl),
      },
    });

    return NextResponse.json({ infrastructure });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to update infrastructure";
    const status = error instanceof PlatformAuthorizationError ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
