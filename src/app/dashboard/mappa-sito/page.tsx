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
  type: "root" | "page" | "category-page" | "article" | "zone";
  meta?: string;
  count?: number;
  isPublished?: boolean;
  color?: string;
  children?: TreeNode[];
  /** category slug for lazy-loading articles */
  categorySlug?: string;
  lazy?: boolean;
}

interface CategoryRow { id: string; name: string; slug: string; color: string | null; parent_id: string | null; sort_order: number }
interface ArticleRow { id: string; title: string; slug: string; status: string; is_featured: boolean; published_at: string | null; category_id: string | null }
interface PageRow { id: string; title: string; slug: string; parent_id: string | null; page_type: string; is_published: boolean; sort_order: number }
interface ZoneRow { id: string; zone_key: string; label: string; zone_type: string; is_active: boolean }

/* ─── component ─── */

export default function MappaSitoPage() {
  const { currentTenant } = useAuthStore();
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [loadedLazy, setLoadedLazy] = useState<Set<string>>(new Set());
  const [allArticles, setAllArticles] = useState<ArticleRow[]>([]);
  const categoriesRef = useRef<CategoryRow[]>([]);

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
    categoriesRef.current = allCats;

    // Map category slug -> category row for matching pages to categories
    const catBySlug = new Map<string, CategoryRow>();
    for (const c of allCats) catBySlug.set(c.slug, c);

    // Count articles per category
    const articleCountByCatId = new Map<string, number>();
    for (const a of allArts) {
      if (a.category_id) articleCountByCatId.set(a.category_id, (articleCountByCatId.get(a.category_id) || 0) + 1);
    }

    // Build page tree — pages of type "category" get article counts and lazy children
    const pageMap = new Map<string, TreeNode>();
    for (const p of allPages) {
      const matchedCat = catBySlug.get(p.slug);
      const isCategoryPage = p.page_type === "category" && matchedCat;
      const articleCount = isCategoryPage ? (articleCountByCatId.get(matchedCat!.id) || 0) : undefined;

      pageMap.set(p.id, {
        id: `page-${p.id}`,
        label: p.title,
        type: isCategoryPage ? "category-page" : "page",
        meta: `/${p.slug}`,
        isPublished: p.is_published,
        color: isCategoryPage ? (matchedCat!.color || undefined) : undefined,
        count: articleCount,
        categorySlug: isCategoryPage ? matchedCat!.slug : undefined,
        children: [],
        lazy: isCategoryPage && (articleCount || 0) > 0,
      });
    }

    const pageRoots: TreeNode[] = [];
    for (const p of allPages) {
      const node = pageMap.get(p.id)!;
      if (p.parent_id && pageMap.has(p.parent_id)) {
        pageMap.get(p.parent_id)!.children!.push(node);
      } else {
        pageRoots.push(node);
      }
    }

    // Zone nodes
    const zoneNodes: TreeNode[] = allZones.map((z) => ({
      id: `zone-${z.id}`,
      label: z.label + (z.is_active ? "" : " (disattiva)"),
      type: "zone" as const,
      meta: `${z.zone_key} · ${z.zone_type}`,
    }));

    const siteTree: TreeNode[] = [{
      id: "root",
      label: currentTenant.name,
      type: "root",
      meta: domain,
      children: [
        ...pageRoots,
        ...(zoneNodes.length > 0 ? [{
          id: "grp-zones",
          label: "Zone Sito",
          type: "page" as const,
          count: zoneNodes.length,
          children: zoneNodes,
        }] : []),
      ],
    }];

    setTree(siteTree);
    // Auto-expand root and pages with children
    const autoExpand = new Set<string>(["root"]);
    for (const p of allPages) {
      if (allPages.some((c) => c.parent_id === p.id)) {
        autoExpand.add(`page-${p.id}`);
      }
    }
    setExpanded(autoExpand);
    setLoading(false);
  }, [currentTenant]);

  useEffect(() => { void load(); }, [load]);

  const toggle = useCallback((nodeId: string) => {
    setExpanded((prev) => { const n = new Set(prev); if (n.has(nodeId)) n.delete(nodeId); else n.add(nodeId); return n; });
  }, []);

  // Lazy-load articles when expanding a category-page node
  const expandLazy = useCallback((nodeId: string, categorySlug: string) => {
    if (loadedLazy.has(nodeId)) { toggle(nodeId); return; }

    const cat = categoriesRef.current.find((c) => c.slug === categorySlug);
    if (!cat) { toggle(nodeId); return; }

    const catArts = allArticles.filter((a) => a.category_id === cat.id);
    const articleNodes: TreeNode[] = catArts.map((a) => ({
      id: `article-${a.id}`,
      label: a.title,
      type: "article" as const,
      meta: a.status === "published" ? "pubblicato" : a.status === "draft" ? "bozza" : a.status,
      isPublished: a.status === "published",
    }));

    setTree((prev) => {
      const inject = (nodes: TreeNode[]): TreeNode[] =>
        nodes.map((n) => {
          if (n.id === nodeId) {
            const existingChildren = (n.children || []).filter((c) => c.type !== "article");
            return { ...n, children: [...existingChildren, ...articleNodes], lazy: false };
          }
          return n.children ? { ...n, children: inject(n.children) } : n;
        });
      return inject(prev);
    });
    setLoadedLazy((prev) => new Set([...prev, nodeId]));
    setExpanded((prev) => new Set([...prev, nodeId]));
  }, [allArticles, loadedLazy, toggle]);

  /* ─── classic tree renderer with │ ├── └── guide lines ─── */

  const LINE_COLOR = "var(--c-border)";

  function getIcon(node: TreeNode, isOpen: boolean) {
    const size = 15;
    switch (node.type) {
      case "root": return <Globe size={size} style={{ color: "var(--c-accent)" }} />;
      case "page": {
        const hasKids = (node.children?.length || 0) > 0;
        if (hasKids) return isOpen ? <FolderOpen size={size} style={{ color: "#e6a817" }} /> : <FolderClosed size={size} style={{ color: "#e6a817" }} />;
        return <FileText size={size} style={{ color: "var(--c-accent)" }} />;
      }
      case "category-page": return isOpen ? <FolderOpen size={size} style={{ color: node.color || "#c0392b" }} /> : <FolderClosed size={size} style={{ color: node.color || "#c0392b" }} />;
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
            if (node.lazy && node.categorySlug && !loadedLazy.has(node.id)) {
              expandLazy(node.id, node.categorySlug);
            } else if (hasChildren) {
              toggle(node.id);
            }
          };

          return (
            <div key={node.id}>
              <div
                className="flex items-center cursor-pointer select-none transition-colors"
                style={{ height: 28 }}
                onClick={handleClick}
                onMouseEnter={(e) => { e.currentTarget.style.background = "var(--c-bg-2)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
              >
                {/* Vertical guide lines from ancestors */}
                {parentLines.map((showLine, i) => (
                  <div key={i} style={{ width: 20, height: 28, position: "relative", flexShrink: 0 }}>
                    {showLine && (
                      <div style={{ position: "absolute", left: 9, top: 0, bottom: 0, width: 1, background: LINE_COLOR }} />
                    )}
                  </div>
                ))}

                {/* Current connector: ├── or └── */}
                {depth > 0 && (
                  <div style={{ width: 20, height: 28, position: "relative", flexShrink: 0 }}>
                    <div style={{ position: "absolute", left: 9, top: 0, height: isLast ? 14 : 28, width: 1, background: LINE_COLOR }} />
                    <div style={{ position: "absolute", left: 9, top: 13, width: 11, height: 1, background: LINE_COLOR }} />
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
                    fontWeight: node.type === "root" ? 700 : hasChildren ? 500 : 400,
                  }}
                >
                  {node.label}
                </span>

                {/* Article count */}
                {node.count !== undefined && node.count > 0 && (
                  <span
                    className="text-[10px] px-1.5 py-0.5 rounded ml-2 shrink-0"
                    style={{ background: "var(--c-bg-2)", color: "var(--c-text-3)", fontVariantNumeric: "tabular-nums" }}
                  >
                    {node.count}
                  </span>
                )}

                {/* Published indicator */}
                {node.isPublished !== undefined && (
                  <span className="ml-1.5 shrink-0">
                    {node.isPublished
                      ? <Eye size={11} style={{ color: "#10b981" }} />
                      : <EyeOff size={11} style={{ color: "var(--c-text-3)" }} />
                    }
                  </span>
                )}

                {/* Meta */}
                {node.meta && (
                  <span className="text-[11px] font-mono ml-auto mr-3 shrink-0" style={{ color: "var(--c-text-3)" }}>
                    {node.meta}
                  </span>
                )}
              </div>

              {/* Children */}
              {hasChildren && isOpen && node.children && (
                <TreeBranch nodes={node.children} depth={depth + 1} parentLines={[...parentLines, !isLast]} />
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
        <div className="rounded-xl border overflow-hidden py-2 font-mono" style={{ borderColor: "var(--c-border)", background: "var(--c-bg-1)" }}>
          <TreeBranch nodes={tree} depth={0} parentLines={[]} />
        </div>
      )}

      <div className="rounded-xl border p-4 space-y-2" style={{ borderColor: "var(--c-border)", background: "var(--c-bg-1)" }}>
        <p className="text-xs font-semibold" style={{ color: "var(--c-text-2)" }}>Legenda</p>
        <div className="flex flex-wrap gap-4 text-[11px]" style={{ color: "var(--c-text-2)" }}>
          <span className="flex items-center gap-1"><FolderOpen size={12} style={{ color: "#e6a817" }} /> Sezione/Pagina con figli</span>
          <span className="flex items-center gap-1"><FileText size={12} style={{ color: "var(--c-accent)" }} /> Pagina</span>
          <span className="flex items-center gap-1"><FolderOpen size={12} style={{ color: "#c0392b" }} /> Categoria (clicca per articoli)</span>
          <span className="flex items-center gap-1"><Newspaper size={12} /> Articolo</span>
          <span className="flex items-center gap-1"><Layout size={12} style={{ color: "#5b7cfa" }} /> Zona</span>
        </div>
      </div>
    </div>
  );
}
