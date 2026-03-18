import { NextResponse } from "next/server";

interface ParsedSlot {
  slot_key: string;
  label: string;
  description: string;
  content_type: string;
  max_items: number;
  style_hint: string;
  // Layout info for visual representation
  layout: {
    tag: string;            // html tag (section, div, aside, etc.)
    display: string;        // flex, grid, block
    width: string;          // css width or "full", "1/2", "1/3", etc.
    height: string;         // estimated height hint
    grid_cols: number;      // if grid, how many columns
    order: number;          // source order in page
    parent_slot: string;    // if nested inside another slot
    classes: string;        // original CSS classes for reference
  };
}

export async function POST(request: Request) {
  try {
    const { files } = await request.json();
    if (!files || !Array.isArray(files)) {
      return NextResponse.json({ error: "files array required" }, { status: 400 });
    }

    const slots: ParsedSlot[] = [];
    let sourceOrder = 0;

    for (const file of files) {
      const content = file.content as string;
      if (!content) continue;

      // Parse data-cms-slot attributes
      const slotRegex = /data-cms-slot=["']([^"']+)["']/g;
      let match;

      while ((match = slotRegex.exec(content)) !== null) {
        const slotKey = match[1];
        if (slots.find(s => s.slot_key === slotKey)) continue;

        // Get surrounding context (the opening tag + nearby attributes)
        const tagStart = content.lastIndexOf("<", match.index);
        const tagEnd = content.indexOf(">", match.index);
        const fullTag = content.slice(tagStart, tagEnd + 1);

        // Extract from nearby lines (up to 800 chars around)
        const start = Math.max(0, match.index - 400);
        const end = Math.min(content.length, match.index + 800);
        const context = content.slice(start, end);

        // Extract attributes
        const labelMatch = context.match(/data-cms-label=["']([^"']+)["']/);
        const countMatch = context.match(/data-cms-count=["'](\d+)["']/);
        const typeMatch = context.match(/data-cms-type=["']([^"']+)["']/);
        const styleMatch = context.match(/data-cms-style=["']([^"']+)["']/);
        const descMatch = context.match(/data-cms-description=["']([^"']+)["']/);
        // Layout-specific attributes
        const widthMatch = context.match(/data-cms-width=["']([^"']+)["']/);
        const heightMatch = context.match(/data-cms-height=["']([^"']+)["']/);
        const colsMatch = context.match(/data-cms-cols=["'](\d+)["']/);

        // Detect tag type
        const tagMatch = fullTag.match(/^<(\w+)/);
        const tagName = tagMatch?.[1] || "div";

        // Extract CSS classes
        const classMatch = fullTag.match(/class(?:Name)?=["']([^"']+)["']/);
        const classes = classMatch?.[1] || "";

        // Infer layout from classes
        const layout = inferLayout(classes, tagName, context);

        slots.push({
          slot_key: slotKey,
          label: labelMatch?.[1] || slotKey.replace(/[-_]/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
          description: descMatch?.[1] || `${tagName} — ${file.path || "unknown"}`,
          content_type: typeMatch?.[1] || "articles",
          max_items: countMatch ? parseInt(countMatch[1]) : 6,
          style_hint: styleMatch?.[1] || "",
          layout: {
            tag: tagName,
            display: layout.display,
            width: widthMatch?.[1] || layout.width,
            height: heightMatch?.[1] || layout.height,
            grid_cols: colsMatch ? parseInt(colsMatch[1]) : layout.gridCols,
            order: sourceOrder++,
            parent_slot: "",
            classes,
          },
        });
      }

      // Also parse CmsSlot components
      const componentRegex = /<CmsSlot[^>]+slot=["']([^"']+)["']/g;
      while ((match = componentRegex.exec(content)) !== null) {
        const slotKey = match[1];
        if (slots.find(s => s.slot_key === slotKey)) continue;
        const ctx = content.slice(Math.max(0, match.index - 100), Math.min(content.length, match.index + 300));
        const labelMatch = ctx.match(/label=["']([^"']+)["']/);
        const countMatch = ctx.match(/count=["']?(\d+)["']?/);
        const widthMatch = ctx.match(/width=["']([^"']+)["']/);

        slots.push({
          slot_key: slotKey,
          label: labelMatch?.[1] || slotKey.replace(/[-_]/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
          description: `CmsSlot component — ${file.path || "unknown"}`,
          content_type: "articles",
          max_items: countMatch ? parseInt(countMatch[1]) : 6,
          style_hint: "",
          layout: {
            tag: "div",
            display: "block",
            width: widthMatch?.[1] || "full",
            height: "auto",
            grid_cols: 1,
            order: sourceOrder++,
            parent_slot: "",
            classes: "",
          },
        });
      }

      // Parse HTML comments <!-- CMS:slot_key:Label:count -->
      const commentRegex = /<!--\s*CMS:([^:]+):([^:]*):?(\d*)\s*-->/g;
      while ((match = commentRegex.exec(content)) !== null) {
        const slotKey = match[1];
        if (slots.find(s => s.slot_key === slotKey)) continue;
        slots.push({
          slot_key: slotKey,
          label: match[2] || slotKey,
          description: `HTML comment — ${file.path || "unknown"}`,
          content_type: "articles",
          max_items: match[3] ? parseInt(match[3]) : 6,
          style_hint: "",
          layout: {
            tag: "div", display: "block", width: "full", height: "auto",
            grid_cols: 1, order: sourceOrder++, parent_slot: "", classes: "",
          },
        });
      }
    }

    return NextResponse.json({ slots, count: slots.length });
  } catch {
    return NextResponse.json({ error: "Parse error" }, { status: 500 });
  }
}

function inferLayout(classes: string, tag: string, context: string): {
  display: string; width: string; height: string; gridCols: number;
} {
  const cl = classes.toLowerCase();

  // Display type
  let display = "block";
  if (cl.includes("grid")) display = "grid";
  else if (cl.includes("flex")) display = "flex";

  // Width
  let width = "full";
  if (tag === "aside" || cl.includes("sidebar") || cl.includes("side-bar")) width = "1/4";
  else if (cl.includes("w-1/2") || cl.includes("col-span-6") || cl.includes("md:w-1/2")) width = "1/2";
  else if (cl.includes("w-1/3") || cl.includes("col-span-4") || cl.includes("md:w-1/3")) width = "1/3";
  else if (cl.includes("w-2/3") || cl.includes("col-span-8") || cl.includes("md:w-2/3")) width = "2/3";
  else if (cl.includes("w-1/4") || cl.includes("col-span-3") || cl.includes("md:w-1/4")) width = "1/4";
  else if (cl.includes("w-3/4") || cl.includes("col-span-9") || cl.includes("md:w-3/4")) width = "3/4";
  else if (cl.includes("max-w-") || cl.includes("container")) width = "full";

  // Height hints
  let height = "auto";
  if (cl.includes("hero") || cl.includes("h-screen") || cl.includes("min-h-screen")) height = "hero";
  else if (cl.includes("h-96") || cl.includes("h-80") || cl.includes("aspect-video")) height = "large";
  else if (cl.includes("h-64") || cl.includes("h-48")) height = "medium";
  else if (cl.includes("h-32") || cl.includes("h-24") || cl.includes("h-16")) height = "small";
  else if (tag === "header" || tag === "nav") height = "small";
  else if (tag === "footer") height = "medium";

  // Grid columns
  let gridCols = 1;
  const colsMatch = cl.match(/grid-cols-(\d+)/);
  if (colsMatch) gridCols = parseInt(colsMatch[1]);
  else if (cl.includes("sm:grid-cols-2") || cl.includes("md:grid-cols-2")) gridCols = 2;
  else if (cl.includes("sm:grid-cols-3") || cl.includes("md:grid-cols-3") || cl.includes("lg:grid-cols-3")) gridCols = 3;
  else if (cl.includes("md:grid-cols-4") || cl.includes("lg:grid-cols-4")) gridCols = 4;

  return { display, width, height, gridCols };
}
