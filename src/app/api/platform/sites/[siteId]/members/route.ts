import { NextResponse } from "next/server";
import {
  addSiteMemberForCurrentUser,
  listSiteMembersForCurrentUser,
} from "@/lib/platform/membership-service";
import { PlatformAuthorizationError } from "@/lib/platform/authorization";
import { PLATFORM_MEMBERSHIP_ROLES } from "@/lib/platform/types";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ siteId: string }> },
) {
  try {
    const { siteId } = await params;
    const members = await listSiteMembersForCurrentUser(siteId);
    return NextResponse.json({ members });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load members";
    const status = error instanceof PlatformAuthorizationError ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ siteId: string }> },
) {
  try {
    const { siteId } = await params;
    const body = await request.json();
    const email = String(body.email || "").trim();
    const role = String(body.role || "");

    if (!email) {
      return NextResponse.json({ error: "Email obbligatoria" }, { status: 400 });
    }

    if (!PLATFORM_MEMBERSHIP_ROLES.includes(role as (typeof PLATFORM_MEMBERSHIP_ROLES)[number])) {
      return NextResponse.json({ error: "Ruolo non valido" }, { status: 400 });
    }

    const member = await addSiteMemberForCurrentUser({
      siteId,
      email,
      role: role as (typeof PLATFORM_MEMBERSHIP_ROLES)[number],
    });

    return NextResponse.json({ member });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to add member";
    const status = error instanceof PlatformAuthorizationError ? 403 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
