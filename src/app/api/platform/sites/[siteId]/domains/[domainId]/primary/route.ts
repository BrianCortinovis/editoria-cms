import { NextResponse } from "next/server";
import { setPrimaryDomainForSite } from "@/lib/platform/domain/service";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ siteId: string; domainId: string }> },
) {
  try {
    const { siteId, domainId } = await params;
    await setPrimaryDomainForSite(siteId, domainId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to update primary domain" },
      { status: 400 }
    );
  }
}
