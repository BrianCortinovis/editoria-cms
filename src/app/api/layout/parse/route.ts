import { NextResponse } from "next/server";

interface ParsedSlot {
  slot_key: string;
  label: string;
  description: string;
  content_type: string;
  max_items: number;
  style_hint: string;
}

export async function POST(request: Request) {
  try {
    const { files } = await request.json();

    if (!files || !Array.isArray(files)) {
      return NextResponse.json({ error: "files array required" }, { status: 400 });
    }

    const slots: ParsedSlot[] = [];

    for (const file of files) {
      const content = file.content as string;
      if (!content) continue;

      // Parse data-cms-slot attributes from HTML/JSX
      // Matches: data-cms-slot="hero" data-cms-label="..." data-cms-count="1"
      const slotRegex = /data-cms-slot=["']([^"']+)["']/g;
      let match;

      while ((match = slotRegex.exec(content)) !== null) {
        const slotKey = match[1];

        // Extract surrounding context to find label and count
        const start = Math.max(0, match.index - 200);
        const end = Math.min(content.length, match.index + 500);
        const context = content.slice(start, end);

        const labelMatch = context.match(/data-cms-label=["']([^"']+)["']/);
        const countMatch = context.match(/data-cms-count=["'](\d+)["']/);
        const typeMatch = context.match(/data-cms-type=["']([^"']+)["']/);
        const styleMatch = context.match(/data-cms-style=["']([^"']+)["']/);
        const descMatch = context.match(/data-cms-description=["']([^"']+)["']/);

        // Try to infer from tag/class names
        const tagMatch = context.match(/<(section|div|aside|article|main|header|footer)[^>]*data-cms-slot/);
        const classMatch = context.match(/class(?:Name)?=["']([^"']+)["'][^>]*data-cms-slot|data-cms-slot[^>]*class(?:Name)?=["']([^"']+)["']/);

        if (!slots.find(s => s.slot_key === slotKey)) {
          slots.push({
            slot_key: slotKey,
            label: labelMatch?.[1] || slotKey.replace(/[-_]/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
            description: descMatch?.[1] || `Zona: ${tagMatch?.[1] || "div"} — ${file.path || "unknown"}`,
            content_type: typeMatch?.[1] || "articles",
            max_items: countMatch ? parseInt(countMatch[1]) : 6,
            style_hint: styleMatch?.[1] || classMatch?.[1] || classMatch?.[2] || "",
          });
        }
      }

      // Also parse React component patterns like <CmsSlot slot="hero" />
      const componentRegex = /<CmsSlot[^>]+slot=["']([^"']+)["']/g;
      while ((match = componentRegex.exec(content)) !== null) {
        const slotKey = match[1];
        if (!slots.find(s => s.slot_key === slotKey)) {
          const start = Math.max(0, match.index - 100);
          const end = Math.min(content.length, match.index + 300);
          const ctx = content.slice(start, end);

          const labelMatch = ctx.match(/label=["']([^"']+)["']/);
          const countMatch = ctx.match(/count=["']?(\d+)["']?/);

          slots.push({
            slot_key: slotKey,
            label: labelMatch?.[1] || slotKey.replace(/[-_]/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
            description: `Component CmsSlot — ${file.path || "unknown"}`,
            content_type: "articles",
            max_items: countMatch ? parseInt(countMatch[1]) : 6,
            style_hint: "",
          });
        }
      }

      // Parse HTML comments <!-- CMS:slot_key:Label:count -->
      const commentRegex = /<!--\s*CMS:([^:]+):([^:]*):?(\d*)\s*-->/g;
      while ((match = commentRegex.exec(content)) !== null) {
        const slotKey = match[1];
        if (!slots.find(s => s.slot_key === slotKey)) {
          slots.push({
            slot_key: slotKey,
            label: match[2] || slotKey,
            description: `HTML comment marker — ${file.path || "unknown"}`,
            content_type: "articles",
            max_items: match[3] ? parseInt(match[3]) : 6,
            style_hint: "",
          });
        }
      }
    }

    return NextResponse.json({ slots, count: slots.length });
  } catch {
    return NextResponse.json({ error: "Parse error" }, { status: 500 });
  }
}
