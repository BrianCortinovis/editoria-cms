"use client";

import { useState, useMemo } from "react";
import { PAGE_TEMPLATES, type PageTemplate } from "@/lib/templates/page-templates";
import { usePageStore } from "@/lib/stores/page-store";
import { Search, Layout, FileText, Building2, Blocks, ChevronDown } from "lucide-react";
import toast from "react-hot-toast";

const CATEGORY_META: Record<string, { label: string; icon: typeof Layout }> = {
  editorial: { label: "Editoriale", icon: FileText },
  business: { label: "Business", icon: Building2 },
  generic: { label: "Generico", icon: Blocks },
  layout: { label: "Layout", icon: Layout },
};

export function PageTemplatePanel() {
  const { replacePage, blocks } = usePageStore();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let list = PAGE_TEMPLATES;
    if (selectedCategory !== "all") {
      list = list.filter((t) => t.category === selectedCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q)
      );
    }
    return list;
  }, [search, selectedCategory]);

  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const t of PAGE_TEMPLATES) {
      counts.set(t.category, (counts.get(t.category) || 0) + 1);
    }
    return [
      { id: "all", label: `Tutti (${PAGE_TEMPLATES.length})` },
      ...Array.from(counts.entries()).map(([id, count]) => ({
        id,
        label: `${CATEGORY_META[id]?.label || id} (${count})`,
      })),
    ];
  }, []);

  const applyTemplate = (template: PageTemplate) => {
    if (blocks.length > 0 && confirmId !== template.id) {
      setConfirmId(template.id);
      return;
    }
    replacePage(template.blocks, {});
    setConfirmId(null);
    toast.success(`Template "${template.name}" applicato`);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="px-3 pt-3 pb-2 space-y-2">
        <div className="relative">
          <Search
            size={13}
            className="absolute left-2.5 top-1/2 -translate-y-1/2"
            style={{ color: "var(--c-text-2)" }}
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cerca template..."
            className="w-full pl-8 pr-3 py-1.5 rounded-lg text-xs"
            style={{
              background: "var(--c-bg-1)",
              border: "1px solid var(--c-border)",
              color: "var(--c-text-1)",
            }}
          />
        </div>

        {/* Category filter */}
        <div className="relative">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full appearance-none pl-3 pr-8 py-1.5 rounded-lg text-xs"
            style={{
              background: "var(--c-bg-1)",
              border: "1px solid var(--c-border)",
              color: "var(--c-text-1)",
            }}
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
          <ChevronDown
            size={12}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: "var(--c-text-2)" }}
          />
        </div>
      </div>

      {/* Template list */}
      <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-2">
        {filtered.length === 0 ? (
          <p
            className="text-xs text-center py-6"
            style={{ color: "var(--c-text-2)" }}
          >
            Nessun template trovato
          </p>
        ) : (
          filtered.map((template) => {
            const meta = CATEGORY_META[template.category];
            const Icon = meta?.icon || Blocks;
            const isConfirming = confirmId === template.id;

            return (
              <div
                key={template.id}
                className="rounded-xl overflow-hidden"
                style={{
                  border: "1px solid var(--c-border)",
                  background: "var(--c-bg-1)",
                }}
              >
                {/* Color preview bar */}
                <div
                  className="h-2"
                  style={{ background: template.previewColor }}
                />

                <div className="px-3 py-2.5 space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div
                        className="text-xs font-semibold truncate"
                        style={{ color: "var(--c-text-0)" }}
                      >
                        {template.name}
                      </div>
                      <div
                        className="text-[10px] mt-0.5 line-clamp-2"
                        style={{ color: "var(--c-text-2)" }}
                      >
                        {template.description}
                      </div>
                    </div>
                    <span
                      className="shrink-0 inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-semibold"
                      style={{
                        background: "var(--c-bg-2)",
                        color: "var(--c-text-2)",
                      }}
                    >
                      <Icon size={9} />
                      {template.blocks.length}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => applyTemplate(template)}
                    className="w-full rounded-lg px-2 py-1.5 text-[11px] font-semibold transition"
                    style={{
                      background: isConfirming
                        ? "#ef4444"
                        : "var(--c-accent)",
                      color: "#fff",
                    }}
                  >
                    {isConfirming
                      ? "Conferma — sostituisce blocchi attuali"
                      : "Applica template"}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
