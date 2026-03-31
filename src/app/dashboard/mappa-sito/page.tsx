"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useAuthStore } from "@/lib/store";
import { createClient } from "@/lib/supabase/client";
import {
  Globe,
  FileText,
  FolderOpen,
  FolderClosed,
  Layout,
  Newspaper,
  Eye,
  EyeOff,
} from "lucide-react";

/* ─── types ─── */

interface TreeNode {
  id: string;
  label: string;
  type: "root" | "group" | "page" | "category" | "article" | "zone";
  meta?: string;
  count?: number;
  isPublished?: boolean;
  color?: string;
  children?: TreeNode[];
  lazy?: boolean;
}

interface CategoryRow { id: string; name: string; slug: string; color: string | null; parent_id: string | null; sort_order: number }
interface ArticleRow { id: string; title: string; slug: string; status: string; is_featured: boolean; published_at: string | null; category_id: string | null }
interface PageRow { id: string; title: string; slug: string; parent_id: string | null; page_type: string; is_published: boolean; sort_order: number }
interface ZoneRow { id: string; zone_key: string; label: string; zone_type: string; is_active: boolean }

/* ─── tree builders ─── */

function buildCategoryTree(cats: CategoryRow[]): TreeNode[] {
  const map = new Map<string, TreeNode>();
  for (const c of cats) {
    map.set(c.id, { id: `cat-${c.id}`, label: c.name, type: "category", color: c.color || undefined, meta: c.slug, children: [], lazy: true });
  }
  const roots: TreeNode[] = [];
  for (const c of cats) {
    const node = map.get(c.id)!;
    if (c.parent_id && map.has(c.parent_id)) map.get(c.parent_id)!.children!.push(node);
    else roots.push(node);
  }
  return roots;
}

function buildPageTree(pages: PageRow[]): TreeNode[] {
  const map = new Map<string, TreeNode>();
  for (const p of pages) {
    map.set(p.id, { id: `page-${p.id}`, label: p.title, type: "page", meta: `/${p.slug}`, isPublished: p.is_published, children: [] });
  }
  const roots: TreeNode[] = [];
  for (const p of pages) {
    const node = map.get(p.id)!;
    if (p.parent_id && map.has(p.parent_id)) map.get(p.parent_id)!.children!.push(node);
    else roots.push(node);
  }
  return roots;
}

/* ─── main component ─── */

export default function MappaSitoPage() {
  const { currentTenant } = useAuthStore();
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [loadedCategories, setLoadedCategories] = useState<Set<string>>(new Set());
  const [allArticles, setAllArticles] = useState<ArticleRow[]>([]);
  const articlesLoaded = useRef(false);

  const load = useCallback(async () => {
    if (!currentTenant) return;
    setLoading(true);
    const sb = createClient();

    const [{ data: pages }, { data: categories }, { data: zones }, { data: articles }, tenantResult] = await Promise.all([
      sb.from("site_pages").select("id, title, slug, parent_id, page_type, is_published, sort_order").eq("tenant_id", currentTenant.id).order("sort_order").order("title"),
      sb.from("categories").select("id, name, slug, color, parent_id, sort_order").eq("tenant_id", currentTenant.id).order("sort_order"),
      sb.from("content_zones").select("id, zone_key, label, zone_type, is_active").eq("tenant_id", currentTenant.id).order("sort_order"),
      sb.from("articles").select("id, title, slug, status, is_featured, published_at, category_id").eq("tenant_id", currentTenant.id).order("published_at", { ascending: false }),
      sb.from("tenants").select("domain").eq("id", currentTenant.id).single(),
    ]);

    const domain = (tenantResult.data as { domain?: string } | null)?.domain || "non-collegato";
    const allCats = (categories || []) as CategoryRow[];
    const allArts = (articles || []) as ArticleRow[];
    const allPages = (pages || []) as PageRow[];
    const allZones = (zones || []) as ZoneRow[];

    setAllArticles(allArts);
    articlesLoaded.current = true;

    const catTree = buildCategoryTree(allCats);
    const articlesByCategory = new Map<string, number>();
    let uncategorizedCount = 0;
    for (const a of allArts) {
      if (a.category_id) articlesByCategory.set(a.category_id, (articlesByCategory.get(a.category_id) || 0) + 1);
      else uncategorizedCount++;
    }

    const injectCounts = (nodes: TreeNode[]) => {
      for (const n of nodes) {
        const catId = n.id.replace("cat-", "");
        const c = articlesByCategory.get(catId);
        if (c) n.count = c;
        if (n.children?.length) injectCounts(n.children);
      }
    };
    injectCounts(catTree);

    const pageTree = buildPageTree(allPages);

    const siteTree: TreeNode[] = [{
      id: "root",
      label: currentTenant.name,
      type: "root",
      meta: domain,
      children: [
        { id: "grp-pages", label: "Pagine", type: "group", count: allPages.length, children: pageTree },
        {
          id: "grp-notizie", label: "Notizie", type: "group", count: allArts.length,
          children: [
            ...catTree,
            ...(uncategorizedCount > 0 ? [{ id: "cat-uncategorized", label: "Senza categoria", type: "category" as const, count: uncategorizedCount, lazy: true, children: [] as TreeNode[] }] : []),
          ],
        },
        {
          id: "grp-zones", label: "Zone Sito", type: "group", count: allZones.length,
          children: allZones.map((z) => ({ id: `zone-${z.id}`, label: z.label + (z.is_active ? "" : " (disattiva)"), type: "zone" as const, meta: `${z.zone_key} · ${z.zone_type}` })),
        },
      ],
    }];

    setTree(siteTree);
    setExpanded(new Set(["root", "grp-pages", "grp-notizie"]));
    setLoading(false);
  }, [currentTenant]);

  useEffect(() => { void load(); }, [load]);

  const toggle = useCallback((nodeId: string) => {
    setExpanded((prev) => { const n = new Set(prev); if (n.has(nodeId)) n.delete(nodeId); else n.add(nodeId); return n; });
  }, []);

  const expandCategory = useCallback((nodeId: string) => {
    if (loadedCategories.has(nodeId)) { toggle(nodeId); return; }

    const catId = nodeId.replace("cat-", "");
    const catArts = catId === "uncategorized"
      ? allArticles.filter((a) => !a.category_id)
      : allArticles.filter((a) => a.category_id === catId);

    const articleNodes: TreeNode[] = catArts.map((a) => ({
      id: `article-${a.id}`, label: a.title, type: "article" as const,
      meta: a.status === "published" ? "pubblicato" : a.status === "draft" ? "bozza" : a.status,
      isPublished: a.status === "published",
    }));

    setTree((prev) => {
      const inject = (nodes: TreeNode[]): TreeNode[] =>
        nodes.map((n) => {
          if (n.id === nodeId) {
            const subcats = (n.children || []).filter((c) => c.type === "category");
            return { ...n, children: [...subcats, ...articleNodes], lazy: false };
          }
          return n.children ? { ...n, children: inject(n.children) } : n;
        });
      return inject(prev);
    });
    setLoadedCategories((prev) => new Set([...prev, nodeId]));
    setExpanded((prev) => new Set([...prev, nodeId]));
  }, [allArticles, loadedCategories, toggle]);

  /* ─── classic tree renderer with guide lines ─── */

  const LINE_COLOR = "var(--c-border)";

  function getIcon(node: TreeNode, isOpen: boolean) {
    const size = 15;
    switch (node.type) {
      case "root": return <Globe size={size} style={{ color: "var(--c-accent)" }} />;
      case "group": return isOpen ? <FolderOpen size={size} style={{ color: "#e6a817" }} /> : <FolderClosed size={size} style={{ color: "#e6a817" }} />;
      case "page": return <FileText size={size} style={{ color: "var(--c-accent)" }} />;
      case "category": return isOpen ? <FolderOpen size={size} style={{ color: node.color || "#c0392b" }} /> : <FolderClosed size={size} style={{ color: node.color || "#c0392b" }} />;
      case "article": return <Newspaper size={size} style={{ color: "var(--c-text-3)" }} />;
      case "zone": return <Layout size={size} style={{ color: "#5b7cfa" }} />;
      default: return <FileText size={size} />;
    }
  }

  function TreeBranch({ nodes, depth, parentLines }: { nodes: TreeNode[]; depth: number; parentLines: boolean[] }) {
    return (
      <>
        {nodes.map((node, index) => {
          const isLast = index === nodes.length - 1;
          const hasChildren = (node.children && node.children.length > 0) || node.lazy;
          const isOpen = expanded.has(node.id);

          const handleClick = () => {
            if (node.type === "category" && node.lazy && !loadedCategories.has(node.id)) {
              expandCategory(node.id);
            } else if (hasChildren) {
              toggle(node.id);
            }
          };

          return (
            <div key={node.id}>
              {/* Node row */}
              <div
                className="flex items-center cursor-pointer select-none transition-colors"
                style={{ height: 30 }}
                onClick={handleClick}
                onMouseEnter={(e) => { e.currentTarget.style.background = "var(--c-bg-2)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
              >
                {/* Guide lines from parent levels */}
                {parentLines.map((showLine, i) => (
                  <div key={i} style={{ width: 20, height: 30, position: "relative", flexShrink: 0 }}>
                    {showLine && (
                      <div style={{ position: "absolute", left: 9, top: 0, bottom: 0, width: 1, background: LINE_COLOR }} />
                    )}
                  </div>
                ))}

                {/* Current level connector: ├── or └── */}
                {depth > 0 && (
                  <div style={{ width: 20, height: 30, position: "relative", flexShrink: 0 }}>
                    {/* Vertical line (half if last) */}
                    <div style={{ position: "absolute", left: 9, top: 0, height: isLast ? 15 : 30, width: 1, background: LINE_COLOR }} />
                    {/* Horizontal line */}
                    <div style={{ position: "absolute", left: 9, top: 14, width: 11, height: 1, background: LINE_COLOR }} />
                  </div>
                )}

                {/* Icon */}
                <div style={{ flexShrink: 0, display: "flex", alignItems: "center", marginRight: 6, marginLeft: depth === 0 ? 8 : 0 }}>
                  {getIcon(node, isOpen)}
                </div>

                {/* Label */}
                <span
                  className="text-[13px] truncate"
                  style={{
                    color: "var(--c-text-0)",
                    fontWeight: node.type === "root" || node.type === "group" ? 600 : 400,
                  }}
                >
                  {node.label}
                </span>

                {/* Count badge */}
                {node.count !== undefined && node.count > 0 && (
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded ml-2 shrink-0"
                    style={{ background: "var(--c-bg-2)", color: "var(--c-text-3)", fontVariantNumeric: "tabular-nums" }}
                  >
                    {node.count}
                  </span>
                )}

                {/* Published dot */}
                {node.isPublished !== undefined && (
                  <span className="ml-1.5 shrink-0">
                    {node.isPublished
                      ? <Eye size={11} style={{ color: "#10b981" }} />
                      : <EyeOff size={11} style={{ color: "var(--c-text-3)" }} />
                    }
                  </span>
                )}

                {/* Meta slug */}
                {node.meta && (
                  <span className="text-[11px] font-mono ml-auto mr-3 shrink-0" style={{ color: "var(--c-text-3)" }}>
                    {node.meta}
                  </span>
                )}
              </div>

              {/* Children */}
              {hasChildren && isOpen && node.children && (
                <TreeBranch
                  nodes={node.children}
                  depth={depth + 1}
                  parentLines={[...parentLines, !isLast]}
                />
              )}
            </div>
          );
        })}
      </>
    );
  }

  if (!currentTenant) return null;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold" style={{ color: "var(--c-text-0)" }}>Mappa Sito</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--c-text-2)" }}>
          Struttura ad albero del sito — clicca sulle cartelle per espandere.
        </p>
      </div>

      {loading ? (
        <div className="py-12 text-center text-sm" style={{ color: "var(--c-text-2)" }}>Caricamento...</div>
      ) : (
        <div
          className="rounded-xl border overflow-hidden py-2 font-mono"
          style={{ borderColor: "var(--c-border)", background: "var(--c-bg-1)" }}
        >
          <TreeBranch nodes={tree} depth={0} parentLines={[]} />
        </div>
      )}

      <div className="rounded-xl border p-4 space-y-2" style={{ borderColor: "var(--c-border)", background: "var(--c-bg-1)" }}>
        <p className="text-xs font-semibold" style={{ color: "var(--c-text-2)" }}>Legenda</p>
        <div className="flex flex-wrap gap-4 text-[11px]" style={{ color: "var(--c-text-2)" }}>
          <span className="flex items-center gap-1"><FolderClosed size={12} style={{ color: "#e6a817" }} /> Sezione</span>
          <span className="flex items-center gap-1"><FileText size={12} style={{ color: "var(--c-accent)" }} /> Pagina</span>
          <span className="flex items-center gap-1"><FolderClosed size={12} style={{ color: "#c0392b" }} /> Categoria</span>
          <span className="flex items-center gap-1"><Newspaper size={12} /> Articolo</span>
          <span className="flex items-center gap-1"><Layout size={12} style={{ color: "#5b7cfa" }} /> Zona</span>
          <span className="flex items-center gap-1"><Eye size={12} style={{ color: "#10b981" }} /> Pubblicato</span>
          <span className="flex items-center gap-1"><EyeOff size={12} /> Bozza</span>
        </div>
      </div>
    </div>
  );
}
