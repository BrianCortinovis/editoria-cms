import { NextResponse } from "next/server";
import { attachDomainToSite } from "@/lib/platform/domain/service";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ siteId: string }> },
) {
  try {
    const { siteId } = await params;
    const body = await request.json();
    const domain = await attachDomainToSite(siteId, String(body.hostname || ""), Boolean(body.isPrimary));
    return NextResponse.json({ domain });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to attach domain" },
      { status: 400 }
    );
  }
}
