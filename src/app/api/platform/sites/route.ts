import { NextResponse } from "next/server";
import { createSiteForCurrentUser } from "@/lib/platform/site-service";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const created = await createSiteForCurrentUser({
      name: String(body.name || ""),
      slug: String(body.slug || body.name || ""),
      languageCode: String(body.languageCode || "it"),
      templateKey: body.templateKey ? String(body.templateKey) : null,
      category: body.category ? String(body.category) : null,
    });

    return NextResponse.json(created);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to create site" },
      { status: 400 }
    );
  }
}
