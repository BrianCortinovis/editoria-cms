import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");

  if (secret !== process.env.REVALIDATION_SECRET) {
    return NextResponse.json({ error: "Invalid secret" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { type, path } = body;

    if (path) {
      revalidatePath(path);
    }

    if (type === "article") {
      revalidatePath("/");
      if (body.slug) {
        revalidatePath(`/articoli/${body.slug}`);
      }
      if (body.category_slug) {
        revalidatePath(`/categoria/${body.category_slug}`);
      }
    } else if (type === "event") {
      revalidatePath("/eventi");
    } else if (type === "breaking_news") {
      revalidatePath("/");
    }

    return NextResponse.json({ revalidated: true, now: Date.now() });
  } catch {
    return NextResponse.json(
      { error: "Error revalidating" },
      { status: 500 }
    );
  }
}
