"use client";

import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { ArrowDown, ArrowUp, Link2, Plus, Save, Tag, FileText, FolderOpen } from "lucide-react";
import { useAuthStore } from "@/lib/store";
import { createClient } from "@/lib/supabase/client";
import { generateId } from "@/lib/utils/id";
import { normalizeNavigationConfig, type SiteMenuItem, type SiteMenuKey } from "@/lib/site/navigation";
import AIButton from "@/components/ai/AIButton";

interface SourceItem {
  id: string;
  label: string;
  url: string;
  kind: "page" | "category" | "tag";
  icon: string;
}

const MENU_KEYS: Array<{ key: SiteMenuKey; label: string }> = [
  { key: "primary", label: "Primary" },
  { key: "secondary", label: "Secondario" },
  { key: "mobile", label: "Mobile" },
  { key: "footer", label: "Footer" },
];

function updateItems(items: SiteMenuItem[], id: string, updater: (item: SiteMenuItem) => SiteMenuItem): SiteMenuItem[] {
  return items.map((item) => {
    if (item.id === id) {
      return updater(item);
    }

    return {
      ...item,
      children: item.children ? updateItems(item.children, id, updater) : [],
    };
  });
}

function removeItems(items: SiteMenuItem[], id: string): SiteMenuItem[] {
  return items
    .filter((item) => item.id !== id)
    .map((item) => ({
      ...item,
      children: item.children ? removeItems(item.children, id) : [],
    }));
}

function moveItem(items: SiteMenuItem[], index: number, direction: -1 | 1): SiteMenuItem[] {
  const nextIndex = index + direction;
  if (nextIndex < 0 || nextIndex >= items.length) {
    return items;
  }

  const copy = [...items];
  const [removed] = copy.splice(index, 1);
  copy.splice(nextIndex, 0, removed);
  return copy;
}

function ItemEditor({
  item,
  onChange,
  onRemove,
  onAddChild,
  onMoveUp,
  onMoveDown,
}: {
  item: SiteMenuItem;
  onChange: (item: SiteMenuItem) => void;
  onRemove: () => void;
  onAddChild: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  return (
    <div className="rounded-lg p-3 space-y-3" style={{ background: "var(--c-bg-2)" }}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <input
          value={item.label}
          onChange={(event) => onChange({ ...item, label: event.target.value })}
          placeholder="Etichetta"
          className="w-full px-3 py-2 rounded-lg text-sm"
          style={{ border: "1px solid var(--c-border)" }}
        />
        <input
          value={item.url}
          onChange={(event) => onChange({ ...item, url: event.target.value })}
          placeholder="/percorso"
          className="w-full px-3 py-2 rounded-lg text-sm"
          style={{ border: "1px solid var(--c-border)" }}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <input
          value={item.description || ""}
          onChange={(event) => onChange({ ...item, description: event.target.value })}
          placeholder="Descrizione opzionale"
          className="w-full px-3 py-2 rounded-lg text-sm"
          style={{ border: "1px solid var(--c-border)" }}
        />
        <select
          value={item.target || "_self"}
          onChange={(event) => onChange({ ...item, target: event.target.value as "_self" | "_blank" })}
          className="w-full px-3 py-2 rounded-lg text-sm"
          style={{ border: "1px solid var(--c-border)" }}
        >
          <option value="_self">Stessa finestra</option>
          <option value="_blank">Nuova finestra</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <input
          value={item.icon || ""}
          onChange={(event) => onChange({ ...item, icon: event.target.value })}
          placeholder="Icona es. home, newspaper, play"
          className="w-full px-3 py-2 rounded-lg text-sm"
          style={{ border: "1px solid var(--c-border)" }}
        />
        <input
          value={item.badge || ""}
          onChange={(event) => onChange({ ...item, badge: event.target.value })}
          placeholder="Badge es. Live, New"
          className="w-full px-3 py-2 rounded-lg text-sm"
          style={{ border: "1px solid var(--c-border)" }}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <button onClick={onMoveUp} className="px-3 py-2 rounded-lg text-sm" style={{ background: "var(--c-bg-1)", color: "var(--c-text-1)" }}>
          <ArrowUp className="w-4 h-4 inline mr-1" /> Su
        </button>
        <button onClick={onMoveDown} className="px-3 py-2 rounded-lg text-sm" style={{ background: "var(--c-bg-1)", color: "var(--c-text-1)" }}>
          <ArrowDown className="w-4 h-4 inline mr-1" /> Giù
        </button>
        <button onClick={onAddChild} className="px-3 py-2 rounded-lg text-sm" style={{ background: "var(--c-bg-1)", color: "var(--c-text-1)" }}>
          <Plus className="w-4 h-4 inline mr-1" /> Sottovoce
        </button>
        <button onClick={onRemove} className="px-3 py-2 rounded-lg text-sm" style={{ background: "rgba(239,68,68,0.12)", color: "var(--c-danger)" }}>
          Rimuovi
        </button>
      </div>

      {item.children && item.children.length > 0 && (
        <div className="space-y-2 pl-4 border-l" style={{ borderColor: "var(--c-border)" }}>
          {item.children.map((child, index) => (
            <ItemEditor
              key={child.id || `${child.url}-${index}`}
              item={child}
              onChange={(nextChild) => onChange({
                ...item,
                children: (item.children || []).map((entry) => (entry.id === child.id ? nextChild : entry)),
              })}
              onRemove={() => onChange({ ...item, children: (item.children || []).filter((entry) => entry.id !== child.id) })}
              onAddChild={() => onChange({
                ...item,
                children: [
                  ...(item.children || []),
                  { id: generateId(), label: "Nuova sottovoce", url: "#", sourceType: "custom", target: "_self", children: [] },
                ],
              })}
              onMoveUp={() => onChange({ ...item, children: moveItem(item.children || [], index, -1) })}
              onMoveDown={() => onChange({ ...item, children: moveItem(item.children || [], index, 1) })}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function MenuPage() {
  const { currentTenant } = useAuthStore();
  const [menuKey, setMenuKey] = useState<SiteMenuKey>("primary");
  const [navigationConfig, setNavigationConfig] = useState<Record<SiteMenuKey, SiteMenuItem[]>>({
    primary: [],
    secondary: [],
    mobile: [],
    footer: [],
  });
  const [sources, setSources] = useState<SourceItem[]>([]);
  const [saving, setSaving] = useState(false);

  const activeItems = navigationConfig[menuKey] || [];

  useEffect(() => {
    let cancelled = false;

    const timer = window.setTimeout(() => {
      const run = async () => {
        if (!currentTenant?.id) return;

        const [configRes] = await Promise.all([
          fetch(`/api/builder/config?tenant_id=${currentTenant.id}`).then((res) => res.json()),
        ]);

        if (cancelled) return;
        setNavigationConfig(normalizeNavigationConfig(configRes.config?.navigation || []));

        const supabase = createClient();
        const [pagesRes, categoriesRes, tagsRes] = await Promise.all([
          supabase.from("site_pages").select("id, title, slug").eq("tenant_id", currentTenant.id).eq("is_published", true).order("title"),
          supabase.from("categories").select("id, name, slug").eq("tenant_id", currentTenant.id).order("name"),
          supabase.from("tags").select("id, name, slug").eq("tenant_id", currentTenant.id).order("name"),
        ]);

        if (cancelled) return;

        const nextSources: SourceItem[] = [
          ...((pagesRes.data || []).map((page) => ({ id: String(page.id), label: String(page.title), url: `/${String(page.slug)}`, kind: "page" as const, icon: "file" }))),
          ...((categoriesRes.data || []).map((category) => ({ id: String(category.id), label: `Categoria: ${String(category.name)}`, url: `/categoria/${String(category.slug)}`, kind: "category" as const, icon: "folder" }))),
          ...((tagsRes.data || []).map((tag) => ({ id: String(tag.id), label: `Tag: ${String(tag.name)}`, url: `/tag/${String(tag.slug)}`, kind: "tag" as const, icon: "tag" }))),
        ];

        setSources(nextSources);
      };

      void run();
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [currentTenant]);

  const groupedSources = useMemo(() => ({
    page: sources.filter((item) => item.kind === "page"),
    category: sources.filter((item) => item.kind === "category"),
    tag: sources.filter((item) => item.kind === "tag"),
  }), [sources]);

  const setActiveMenuItems = (items: SiteMenuItem[]) => {
    setNavigationConfig((current) => ({
      ...current,
      [menuKey]: items,
    }));
  };

  const handleSave = async () => {
    if (!currentTenant?.id) return;
    setSaving(true);

    const response = await fetch("/api/builder/config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tenant_id: currentTenant.id,
        navigation: navigationConfig,
      }),
    });

    const payload = await response.json();
    setSaving(false);

    if (!response.ok) {
      toast.error(payload.error || "Errore salvataggio menu");
      return;
    }

    toast.success("Menu salvato");
  };

  const addCustomItem = () => {
    setActiveMenuItems([
      ...activeItems,
      {
        id: generateId(),
        label: "Nuova voce",
        url: "#",
        icon: "menu",
        sourceType: "custom",
        target: "_self",
        children: [],
      },
    ]);
  };

  const addSourceItem = (source: SourceItem) => {
    setActiveMenuItems([
      ...activeItems,
      {
        id: generateId(),
        label: source.label.replace(/^Categoria: |^Tag: /, ""),
        url: source.url,
        icon: source.icon,
        sourceType: source.kind,
        sourceId: source.id,
        target: "_self",
        children: [],
      },
    ]);
  };

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold" style={{ color: "var(--c-text-0)" }}>Menu</h2>
          <p className="text-sm max-w-3xl" style={{ color: "var(--c-text-2)" }}>
            Gestione menu globale del CMS con aggancio a pagine, categorie e tag. I blocchi di navigazione dell&apos;editor possono usare questi menu oppure restare totalmente custom.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <AIButton
            compact
            actions={[
              {
                id: "menu-audit",
                label: "Audit menu",
                prompt: "Analizza la struttura menu del tenant, evidenzia problemi di navigazione, SEO e gerarchia editoriale, e proponi miglioramenti: {context}",
              },
              {
                id: "menu-structure",
                label: "Proponi struttura",
                prompt: "Suggerisci una struttura menu migliore per una testata locale italiana, usando pagine, categorie e tag disponibili nel CMS: {context}",
              },
            ]}
            contextData={JSON.stringify({
              tenant: currentTenant ? { id: currentTenant.id, name: currentTenant.name, slug: currentTenant.slug } : null,
              menuKey,
              navigationConfig,
              sources,
            }, null, 2)}
          />
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2.5 rounded-lg text-white text-sm font-semibold"
            style={{ background: "var(--c-accent)", opacity: saving ? 0.7 : 1 }}
          >
            <Save className="w-4 h-4 inline mr-2" />
            {saving ? "Salvataggio..." : "Salva menu"}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {MENU_KEYS.map((entry) => (
          <button
            key={entry.key}
            onClick={() => setMenuKey(entry.key)}
            className="px-3 py-2 rounded-lg text-sm font-medium"
            style={{
              background: menuKey === entry.key ? "var(--c-accent-soft)" : "var(--c-bg-1)",
              color: menuKey === entry.key ? "var(--c-accent)" : "var(--c-text-1)",
            }}
          >
            {entry.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-6">
        <section className="rounded-xl p-4 space-y-4" style={{ background: "var(--c-bg-1)", border: "1px solid var(--c-border)" }}>
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold" style={{ color: "var(--c-text-0)" }}>
              Voci menu {MENU_KEYS.find((item) => item.key === menuKey)?.label}
            </h3>
            <button onClick={addCustomItem} className="px-3 py-2 rounded-lg text-sm font-medium" style={{ background: "var(--c-bg-2)", color: "var(--c-text-1)" }}>
              <Plus className="w-4 h-4 inline mr-1" /> Voce custom
            </button>
          </div>

          {activeItems.length === 0 ? (
            <div className="rounded-lg p-5 text-sm" style={{ background: "var(--c-bg-2)", color: "var(--c-text-2)" }}>
              Nessuna voce presente in questo menu.
            </div>
          ) : (
            activeItems.map((item, index) => (
              <ItemEditor
                key={item.id || `${item.url}-${index}`}
                item={item}
                onChange={(nextItem) => setActiveMenuItems(updateItems(activeItems, item.id || "", () => nextItem))}
                onRemove={() => setActiveMenuItems(removeItems(activeItems, item.id || ""))}
                onAddChild={() => setActiveMenuItems(updateItems(activeItems, item.id || "", (entry) => ({
                  ...entry,
                  children: [
                    ...(entry.children || []),
                    { id: generateId(), label: "Nuova sottovoce", url: "#", sourceType: "custom", target: "_self", children: [] },
                  ],
                })))}
                onMoveUp={() => setActiveMenuItems(moveItem(activeItems, index, -1))}
                onMoveDown={() => setActiveMenuItems(moveItem(activeItems, index, 1))}
              />
            ))
          )}
        </section>

        <section className="rounded-xl p-4 space-y-5" style={{ background: "var(--c-bg-1)", border: "1px solid var(--c-border)" }}>
          <div>
            <h3 className="text-sm font-semibold" style={{ color: "var(--c-text-0)" }}>Aggiungi dal CMS</h3>
            <p className="text-xs mt-1" style={{ color: "var(--c-text-2)" }}>
              Pagine, categorie e tag pubblici disponibili nel tenant.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--c-text-2)" }}>
                <FileText className="w-3.5 h-3.5 inline mr-1" /> Pagine
              </div>
              <div className="space-y-2">
                {groupedSources.page.map((item) => (
                  <button key={item.id} onClick={() => addSourceItem(item)} className="w-full text-left px-3 py-2 rounded-lg text-sm" style={{ background: "var(--c-bg-2)", color: "var(--c-text-1)" }}>
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--c-text-2)" }}>
                <FolderOpen className="w-3.5 h-3.5 inline mr-1" /> Categorie
              </div>
              <div className="space-y-2">
                {groupedSources.category.map((item) => (
                  <button key={item.id} onClick={() => addSourceItem(item)} className="w-full text-left px-3 py-2 rounded-lg text-sm" style={{ background: "var(--c-bg-2)", color: "var(--c-text-1)" }}>
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--c-text-2)" }}>
                <Tag className="w-3.5 h-3.5 inline mr-1" /> Tag
              </div>
              <div className="space-y-2">
                {groupedSources.tag.map((item) => (
                  <button key={item.id} onClick={() => addSourceItem(item)} className="w-full text-left px-3 py-2 rounded-lg text-sm" style={{ background: "var(--c-bg-2)", color: "var(--c-text-1)" }}>
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-lg p-4" style={{ background: "var(--c-bg-2)" }}>
            <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--c-text-2)" }}>
              <Link2 className="w-3.5 h-3.5 inline mr-1" /> Note
            </div>
            <p className="text-sm" style={{ color: "var(--c-text-2)" }}>
              Il blocco `Navigazione` dell&apos;editor puo usare `Menu globale CMS` oppure una struttura custom locale. Questo modulo governa i menu condivisi del sito.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
