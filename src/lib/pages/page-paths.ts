interface PagePathRow {
  id: string;
  slug: string;
  parent_id: string | null;
  page_type?: string | null;
}

type PagePathResolverClient = {
  from: (table: string) => {
    select: (query: string) => {
      eq: (column: string, value: string) => {
        maybeSingle: () => Promise<{ data: PagePathRow | null }>;
      };
    };
  };
};

export async function resolvePagePublicPathById(
  supabase: unknown,
  pageId: string
) {
  const client = supabase as PagePathResolverClient;
  const segments: string[] = [];
  let currentId: string | null = pageId;
  let guard = 0;

  while (currentId && guard < 16) {
    const result: { data: PagePathRow | null } = await client
      .from("site_pages")
      .select("id, slug, parent_id, page_type")
      .eq("id", currentId)
      .maybeSingle();
    const data = result.data;

    if (!data) {
      break;
    }

    if (data.page_type !== "homepage" && data.slug !== "homepage") {
      segments.unshift(String(data.slug || "").replace(/^\/+|\/+$/g, ""));
    }

    currentId = data.parent_id;
    guard += 1;
  }

  return segments.length > 0 ? `/${segments.join("/")}` : "/";
}
