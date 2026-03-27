import { NextResponse } from "next/server";
import { verifyDomainForSite } from "@/lib/platform/domain/service";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ siteId: string; domainId: string }> },
) {
  try {
    const { siteId, domainId } = await params;
    const status = await verifyDomainForSite(siteId, domainId);
    return NextResponse.json({ status });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to verify domain" },
      { status: 400 }
    );
  }
}
