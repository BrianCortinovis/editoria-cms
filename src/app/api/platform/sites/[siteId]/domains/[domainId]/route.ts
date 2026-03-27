import { NextResponse } from "next/server";
import { removeDomainFromSite } from "@/lib/platform/domain/service";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ siteId: string; domainId: string }> },
) {
  try {
    const { siteId, domainId } = await params;
    await removeDomainFromSite(siteId, domainId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to remove domain" },
      { status: 400 }
    );
  }
}
