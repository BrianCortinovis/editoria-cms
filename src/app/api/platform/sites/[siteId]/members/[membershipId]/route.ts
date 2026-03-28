import { NextResponse } from "next/server";
import {
  revokeSiteMemberForCurrentUser,
  updateSiteMemberRoleForCurrentUser,
} from "@/lib/platform/membership-service";
import { PlatformAuthorizationError } from "@/lib/platform/authorization";
import { PLATFORM_MEMBERSHIP_ROLES } from "@/lib/platform/types";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ siteId: string; membershipId: string }> },
) {
  try {
    const { siteId, membershipId } = await params;
    const body = await request.json();
    const role = String(body.role || "");

    if (!PLATFORM_MEMBERSHIP_ROLES.includes(role as (typeof PLATFORM_MEMBERSHIP_ROLES)[number])) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    await updateSiteMemberRoleForCurrentUser({
      siteId,
      membershipId,
      role: role as (typeof PLATFORM_MEMBERSHIP_ROLES)[number],
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update member";
    const status = error instanceof PlatformAuthorizationError ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ siteId: string; membershipId: string }> },
) {
  try {
    const { siteId, membershipId } = await params;
    await revokeSiteMemberForCurrentUser({ siteId, membershipId });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to remove member";
    const status = error instanceof PlatformAuthorizationError ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
