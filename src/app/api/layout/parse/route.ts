import { NextResponse } from "next/server";

interface ParsedSlot {
  slot_key: string;
  label: string;
  description: string;
  content_type: string;
  max_items: number;
  style_hint: string;
  page: string; // detected page type
  layout: {
    tag: string;
    display: string;
    width: string;
    height: string;
    grid_cols: number;
    order: number;
    classes: string;
  };
}

// Detect page type from filename
function detectPageType(filePath: string): string {
  const name = filePath.toLowerCase().replace(/\\/g, "/");
  const file = name.split("/").pop() || "";

  // Direct page mapping
  if (file.match(/^index\.|^home\.|^homepage\./)) return "homepage";
  if (file.match(/^about|^chi-siamo|^chi_siamo/)) return "about";
  if (file.match(/^contact|^contatt/)) return "contact";
  if (file.match(/^event|^eventi/)) return "events";
  if (file.match(/^news|^notizie|^articol/)) return "article";
  if (file.match(/^categ|^sezione|^rubrica/)) return "category";
  if (file.match(/^map|^mappa/)) return "map";
  if (file.match(/^meteo|^weather/)) return "meteo";
  if (file.match(/^webcam/)) return "webcam";
  if (file.match(/^sci|^ski/)) return "ski";
  if (file.match(/^trek/)) return "trekking";
  if (file.match(/^dove-alloggiare|^alloggi|^hotel|^accomod/)) return "accommodation";
  if (file.match(/^dove-mangiare|^ristoranti|^restaurant/)) return "restaurant";
  if (file.match(/^attivit|^activit/)) return "activities";
  if (file.match(/^alpini|^alpine/)) return "alpine";

  // Next.js / React patterns
  if (name.includes("/page.") || name.includes("/index.")) {
    const dir = name.split("/").slice(-2, -1)[0] || "";
    if (dir === "app" || dir === "src" || dir === "pages") return "homepage";
    return dir.replace(/[[\]()]/g, "").replace(/\.\.\./g, "") || "other";
  }

  return "other";
}

export async function POST(request: Request) {
  try {
    const { files } = await request.json();
    if (!files || !Array.isArray(files)) {
      return NextResponse.json({ error: "files array required" }, { status: 400 });
    }

    const slots: ParsedSlot[] = [];
    let globalOrder = 0;

    // Group files by detected page
    const pageFiles: Record<string, typeof files> = {};

    for (const file of files) {
      const page = detectPageType(file.path || file.name || "");
      if (!pageFiles[page]) pageFiles[page] = [];
      pageFiles[page].push(file);
    }

    // Parse each file
    for (const file of files) {
      const content = file.content as string;
      if (!content) continue;

      const page = detectPageType(file.path || "");

      // Parse data-cms-slot
      const slotRegex = /data-cms-slot=["']([^"']+)["']/g;
      let match;

      while ((match = slotRegex.exec(content)) !== null) {
        const slotKey = match[1];
        if (slots.find(s => s.slot_key === slotKey && s.page === page)) continue;

        const tagStart = content.lastIndexOf("<", match.index);
        const tagEnd = content.indexOf(">", match.index);
        const fullTag = content.slice(tagStart, tagEnd + 1);
        const context = content.slice(Math.max(0, match.index - 400), Math.min(content.length, match.index + 800));

        const labelMatch = context.match(/data-cms-label=["']([^"']+)["']/);
        const countMatch = context.match(/data-cms-count=["'](\d+)["']/);
        const typeMatch = context.match(/data-cms-type=["']([^"']+)["']/);
        const widthMatch = context.match(/data-cms-width=["']([^"']+)["']/);
        const heightMatch = context.match(/data-cms-height=["']([^"']+)["']/);
        const colsMatch = context.match(/data-cms-cols=["'](\d+)["']/);
        const tagNameMatch = fullTag.match(/^<(\w+)/);
        const classMatch = fullTag.match(/class(?:Name)?=["']([^"']+)["']/);

        const layout = inferLayout(classMatch?.[1] || "", tagNameMatch?.[1] || "div");

        slots.push({
          slot_key: slotKey,
          label: labelMatch?.[1] || slotKey.replace(/[-_]/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
          description: `${tagNameMatch?.[1] || "div"} — ${file.path || "unknown"}`,
          content_type: typeMatch?.[1] || "articles",
          max_items: countMatch ? parseInt(countMatch[1]) : 6,
          style_hint: "",
          page,
          layout: {
            tag: tagNameMatch?.[1] || "div",
            display: layout.display,
            width: widthMatch?.[1] || layout.width,
            height: heightMatch?.[1] || layout.height,
            grid_cols: colsMatch ? parseInt(colsMatch[1]) : layout.gridCols,
            order: globalOrder++,
            classes: classMatch?.[1] || "",
          },
        });
      }

      // Parse HTML comments <!-- CMS:slot_key:Label:count -->
      const commentRegex = /<!--\s*CMS:([^:]+):([^:]*):?(\d*)\s*-->/g;
      while ((match = commentRegex.exec(content)) !== null) {
        const slotKey = match[1];
        if (slots.find(s => s.slot_key === slotKey && s.page === page)) continue;
        slots.push({
          slot_key: slotKey, label: match[2] || slotKey, description: `Comment — ${file.path}`,
          content_type: "articles", max_items: match[3] ? parseInt(match[3]) : 6, style_hint: "", page,
          layout: { tag: "div", display: "block", width: "full", height: "auto", grid_cols: 1, order: globalOrder++, classes: "" },
        });
      }
    }

    // Group by page for the response
    const pages: Record<string, ParsedSlot[]> = {};
    for (const slot of slots) {
      if (!pages[slot.page]) pages[slot.page] = [];
      pages[slot.page].push(slot);
    }

    return NextResponse.json({
      slots,
      pages,
      detected_pages: Object.keys(pages),
      count: slots.length,
    });
  } catch {
    return NextResponse.json({ error: "Parse error" }, { status: 500 });
  }
}

function inferLayout(classes: string, tag: string) {
  const cl = classes.toLowerCase();
  let display = "block";
  if (cl.includes("grid")) display = "grid";
  else if (cl.includes("flex")) display = "flex";

  let width = "full";
  if (tag === "aside" || cl.includes("sidebar")) width = "1/3";
  else if (cl.includes("w-1/2") || cl.includes("col-span-6")) width = "1/2";
  else if (cl.includes("w-1/3") || cl.includes("col-span-4")) width = "1/3";
  else if (cl.includes("w-2/3") || cl.includes("col-span-8")) width = "2/3";

  let height = "auto";
  if (cl.includes("hero") || cl.includes("h-screen")) height = "hero";
  else if (cl.includes("h-96") || cl.includes("h-80")) height = "large";
  else if (tag === "header" || tag === "nav" || tag === "footer") height = "small";

  let gridCols = 1;
  const colMatch = cl.match(/grid-cols-(\d+)/);
  if (colMatch) gridCols = parseInt(colMatch[1]);

  return { display, width, height, gridCols };
}
