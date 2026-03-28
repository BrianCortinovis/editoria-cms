import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export async function POST(request: NextRequest) {
  const secret = request.headers.get("x-revalidation-secret");
  if (secret !== process.env.REVALIDATION_SECRET) {
    return NextResponse.json({ error: "Invalid secret" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { tenantSlug, type, slug } = body;

    if (!tenantSlug) {
      return NextResponse.json({ error: "tenantSlug required" }, { status: 400 });
    }

    const paths: string[] = [];

    // Always revalidate homepage
    paths.push(`/site/${tenantSlug}`);

    if (type === "article" && slug) {
      paths.push(`/site/${tenantSlug}/articolo/${slug}`);
    } else if (type === "category" && slug) {
      paths.push(`/site/${tenantSlug}/categoria/${slug}`);
    } else if (type === "page" && slug) {
      paths.push(`/site/${tenantSlug}/${slug}`);
    }

    // Revalidate all specified paths
    for (const path of paths) {
      revalidatePath(path);
    }

    return NextResponse.json({ revalidated: true, paths, now: Date.now() });
  } catch {
    return NextResponse.json(
      { error: "Error revalidating" },
      { status: 500 }
    );
  }
}
