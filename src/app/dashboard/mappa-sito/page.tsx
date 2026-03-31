"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuthStore } from "@/lib/store";
import { createClient } from "@/lib/supabase/client";
import {
  Globe,
  FileText,
  FolderOpen,
  Layout,
  Newspaper,
  ChevronRight,
  ChevronDown,
  ExternalLink,
  Eye,
  EyeOff,
} from "lucide-react";

/* ─── types ─── */

interface TreeNode {
  id: string;
  label: string;
  type: "root" | "group" | "page" | "category" | "article" | "zone" | "external";
  url?: string;
  meta?: string;
  count?: number;
  isPublished?: boolean;
  color?: string;
  children?: TreeNode[];
  /** lazy = children not yet loaded */
  lazy?: boolean;
}

interface CategoryRow {
  id: string;
  name: string;
  slug: string;
  color: string | null;
  parent_id: string | null;
  sort_order: number;
}

interface ArticleRow {
  id: string;
  title: string;
  slug: string;
  status: string;
  is_featured: boolean;
  published_at: string | null;
  category_id: string | null;
}

interface PageRow {
  id: string;
  title: string;
  slug: string;
  parent_id: string | null;
  page_type: string;
  is_published: boolean;
  sort_order: number;
}

interface ZoneRow {
  id: string;
  zone_key: string;
  label: string;
  zone_type: string;
  is_active: boolean;
}

/* ─── helpers ─── */

function buildCategoryTree(cats: CategoryRow[]): TreeNode[] {
  const map = new Map<string, TreeNode>();
  for (const c of cats) {
    map.set(c.id, {
      id: `cat-${c.id}`,
      label: c.name,
      type: "category",
      color: c.color || undefined,
      meta: c.slug,
      children: [],
      lazy: true,
    });
  }

  const roots: TreeNode[] = [];
  for (const c of cats) {
    const node = map.get(c.id)!;
    if (c.parent_id && map.has(c.parent_id)) {
      map.get(c.parent_id)!.children!.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}

function buildPageTree(pages: PageRow[]): TreeNode[] {
  const map = new Map<string, TreeNode>();
  for (const p of pages) {
    map.set(p.id, {
      id: `page-${p.id}`,
      label: p.title,
      type: "page",
      meta: `/${p.slug}`,
      isPublished: p.is_published,
      children: [],
    });
  }

  const roots: TreeNode[] = [];
  for (const p of pages) {
    const node = map.get(p.id)!;
    if (p.parent_id && map.has(p.parent_id)) {
      map.get(p.parent_id)!.children!.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}

/* ─── component ─── */

export default function MappaSitoPage() {
  const { currentTenant } = useAuthStore();
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [loadedCategories, setLoadedCategories] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    if (!currentTenant) return;
    setLoading(true);
    const sb = createClient();

    const [
      { data: pages },
      { data: categories },
      { data: zones },
      { data: articles },
      tenantResult,
    ] = await Promise.all([
      sb.from("site_pages").select("id, title, slug, parent_id, page_type, is_published, sort_order").eq("tenant_id", currentTenant.id).order("sort_order").order("title"),
      sb.from("categories").select("id, name, slug, color, parent_id, sort_order").eq("tenant_id", currentTenant.id).order("sort_order"),
      sb.from("content_zones").select("id, zone_key, label, zone_type, is_active").eq("tenant_id", currentTenant.id).order("sort_order"),
      sb.from("articles").select("id, title, slug, status, is_featured, published_at, category_id").eq("tenant_id", currentTenant.id).order("published_at", { ascending: false }),
      sb.from("tenants").select("domain").eq("id", currentTenant.id).single(),
    ]);

    const domain = (tenantResult.data as { domain?: string } | null)?.domain || "non-collegato";
    const allCategories = (categories || []) as CategoryRow[];
    const allArticles = (articles || []) as ArticleRow[];
    const allPages = (pages || []) as PageRow[];
    const allZones = (zones || []) as ZoneRow[];

    // Build category tree with articles as children
    const catTree = buildCategoryTree(allCategories);

    // Count articles per category (including uncategorized)
    const articlesByCategory = new Map<string, ArticleRow[]>();
    let uncategorizedCount = 0;
    for (const a of allArticles) {
      if (a.category_id) {
        const existing = articlesByCategory.get(a.category_id) || [];
        existing.push(a);
        articlesByCategory.set(a.category_id, existing);
      } else {
        uncategorizedCount++;
      }
    }

    // Inject article counts and lazy article children into category nodes
    const injectArticleCounts = (nodes: TreeNode[]) => {
      for (const node of nodes) {
        const catId = node.id.replace("cat-", "");
        const catArticles = articlesByCategory.get(catId);
        if (catArticles) {
          node.count = catArticles.length;
        }
        if (node.children && node.children.length > 0) {
          injectArticleCounts(node.children);
        }
      }
    };
    injectArticleCounts(catTree);

    // Store articles for lazy loading
    articlesCache.current = articlesByCategory;

    // Build pages tree
    const pageTree = buildPageTree(allPages);

    // Build complete site tree
    const siteTree: TreeNode[] = [
      {
        id: "root",
        label: currentTenant.name,
        type: "root",
        meta: domain,
        children: [
          {
            id: "grp-pages",
            label: "Pagine",
            type: "group",
            count: allPages.length,
            children: pageTree,
          },
          {
            id: "grp-notizie",
            label: "Notizie",
            type: "group",
            count: allArticles.length,
            children: [
              ...catTree,
              ...(uncategorizedCount > 0
                ? [
                    {
                      id: "cat-uncategorized",
                      label: "Senza categoria",
                      type: "category" as const,
                      count: uncategorizedCount,
                      lazy: true,
                      children: [] as TreeNode[],
                    },
                  ]
                : []),
            ],
          },
          {
            id: "grp-zones",
            label: "Zone Sito",
            type: "group",
            count: allZones.length,
            children: allZones.map((z) => ({
              id: `zone-${z.id}`,
              label: z.label + (z.is_active ? "" : " (disattiva)"),
              type: "zone" as const,
              meta: `${z.zone_key} · ${z.zone_type}`,
            })),
          },
        ],
      },
    ];

    setTree(siteTree);
    setExpanded(new Set(["root", "grp-pages", "grp-notizie"]));
    setLoading(false);
  }, [currentTenant]);

  // Cache articles for lazy expansion
  const articlesCache = { current: new Map<string, ArticleRow[]>() };

  // Store allArticles for uncategorized lookup
  const [allArticlesState, setAllArticlesState] = useState<ArticleRow[]>([]);

  const loadFull = useCallback(async () => {
    if (!currentTenant) return;
    const sb = createClient();
    const { data: articles } = await sb
      .from("articles")
      .select("id, title, slug, status, is_featured, published_at, category_id")
      .eq("tenant_id", currentTenant.id)
      .order("published_at", { ascending: false });
    setAllArticlesState((articles || []) as ArticleRow[]);
  }, [currentTenant]);

  useEffect(() => {
    void load();
    void loadFull();
  }, [load, loadFull]);

  const toggle = useCallback((nodeId: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) next.delete(nodeId);
      else next.add(nodeId);
      return next;
    });
  }, []);

  // Lazy-load articles when expanding a category node
  const expandCategory = useCallback((nodeId: string) => {
    if (loadedCategories.has(nodeId)) {
      toggle(nodeId);
      return;
    }

    const catId = nodeId.replace("cat-", "");
    let catArticles: ArticleRow[];
    if (catId === "uncategorized") {
      catArticles = allArticlesState.filter((a) => !a.category_id);
    } else {
      catArticles = allArticlesState.filter((a) => a.category_id === catId);
    }

    const articleNodes: TreeNode[] = catArticles.map((a) => ({
      id: `article-${a.id}`,
      label: a.title,
      type: "article" as const,
      meta: a.status === "published" ? "pubblicato" : a.status === "draft" ? "bozza" : a.status,
      isPublished: a.status === "published",
    }));

    // Inject into tree
    setTree((prev) => {
      const inject = (nodes: TreeNode[]): TreeNode[] =>
        nodes.map((n) => {
          if (n.id === nodeId) {
            const existingSubcats = (n.children || []).filter((c) => c.type === "category");
            return { ...n, children: [...existingSubcats, ...articleNodes], lazy: false };
          }
          if (n.children) {
            return { ...n, children: inject(n.children) };
          }
          return n;
        });
      return inject(prev);
    });

    setLoadedCategories((prev) => new Set([...prev, nodeId]));
    setExpanded((prev) => new Set([...prev, nodeId]));
  }, [allArticlesState, loadedCategories, toggle]);

  /* ─── TreeNode renderer ─── */

  function NodeRow({ node, depth = 0 }: { node: TreeNode; depth?: number }) {
    const hasChildren = (node.children && node.children.length > 0) || node.lazy;
    const isOpen = expanded.has(node.id);
    const indent = depth * 20;

    const iconMap: Record<string, typeof Globe> = {
      root: Globe,
      group: FolderOpen,
      page: FileText,
      category: FolderOpen,
      article: Newspaper,
      zone: Layout,
      external: ExternalLink,
    };
    const Icon = iconMap[node.type] || FileText;

    const colorMap: Record<string, string> = {
      root: "var(--c-accent)",
      group: "var(--c-text-2)",
      page: "var(--c-accent)",
      category: node.color || "#c0392b",
      article: "var(--c-text-2)",
      zone: "#5b7cfa",
      external: "#f39c12",
    };

    const handleClick = () => {
      if (node.type === "category" && node.lazy) {
        expandCategory(node.id);
      } else if (hasChildren) {
        toggle(node.id);
      }
    };

    return (
      <>
        <div
          className="flex items-center gap-2 py-2 px-3 transition cursor-pointer border-b"
          style={{
            paddingLeft: indent + 12,
            borderColor: "var(--c-border)",
            background: node.type === "root" ? "var(--c-bg-2)" : "transparent",
          }}
          onClick={handleClick}
          onMouseEnter={(e) => { if (node.type !== "root") e.currentTarget.style.background = "var(--c-bg-2)"; }}
          onMouseLeave={(e) => { if (node.type !== "root") e.currentTarget.style.background = "transparent"; }}
        >
          {/* Expand arrow */}
          {hasChildren ? (
            isOpen
              ? <ChevronDown size={14} style={{ color: "var(--c-text-2)", flexShrink: 0 }} />
              : <ChevronRight size={14} style={{ color: "var(--c-text-2)", flexShrink: 0 }} />
          ) : (
            <div style={{ width: 14, flexShrink: 0 }} />
          )}

          {/* Icon */}
          <Icon size={14} style={{ color: colorMap[node.type], flexShrink: 0 }} />

          {/* Label */}
          <span
            className="text-sm font-medium truncate"
            style={{
              color: node.type === "root" ? "var(--c-text-0)" : "var(--c-text-0)",
              fontWeight: node.type === "root" || node.type === "group" ? 600 : 400,
            }}
          >
            {node.label}
          </span>

          {/* Count badge */}
          {node.count !== undefined && node.count > 0 && (
            <span
              className="text-[10px] px-1.5 py-0.5 rounded-md shrink-0"
              style={{ background: "var(--c-bg-2)", color: "var(--c-text-2)", border: "1px solid var(--c-border)" }}
            >
              {node.count}
            </span>
          )}

          {/* Published indicator for articles/pages */}
          {node.isPublished !== undefined && (
            node.isPublished
              ? <Eye size={12} style={{ color: "var(--c-success, #10b981)", flexShrink: 0 }} />
              : <EyeOff size={12} style={{ color: "var(--c-text-3)", flexShrink: 0 }} />
          )}

          {/* Meta (slug, domain, etc) */}
          {node.meta && (
            <span className="text-[11px] font-mono ml-auto shrink-0" style={{ color: "var(--c-text-3)" }}>
              {node.meta}
            </span>
          )}
        </div>

        {/* Children */}
        {hasChildren && isOpen && node.children && node.children.map((child) => (
          <NodeRow key={child.id} node={child} depth={depth + 1} />
        ))}
      </>
    );
  }

  if (!currentTenant) return null;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold" style={{ color: "var(--c-text-0)" }}>
          Mappa Sito
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--c-text-2)" }}>
          Struttura ad albero completa — espandi le categorie per vedere gli articoli.
        </p>
      </div>

      {loading ? (
        <div className="py-12 text-center text-sm" style={{ color: "var(--c-text-2)" }}>Caricamento...</div>
      ) : (
        <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--c-border)", background: "var(--c-bg-1)" }}>
          {tree.map((node) => (
            <NodeRow key={node.id} node={node} />
          ))}
        </div>
      )}

      {/* Legend */}
      <div className="rounded-xl border p-4 space-y-2" style={{ borderColor: "var(--c-border)", background: "var(--c-bg-1)" }}>
        <p className="text-xs font-semibold" style={{ color: "var(--c-text-2)" }}>Legenda</p>
        <div className="flex flex-wrap gap-4 text-[11px]" style={{ color: "var(--c-text-2)" }}>
          <span className="flex items-center gap-1"><FileText size={12} style={{ color: "var(--c-accent)" }} /> Pagina</span>
          <span className="flex items-center gap-1"><FolderOpen size={12} style={{ color: "#c0392b" }} /> Categoria</span>
          <span className="flex items-center gap-1"><Newspaper size={12} /> Articolo</span>
          <span className="flex items-center gap-1"><Layout size={12} style={{ color: "#5b7cfa" }} /> Zona</span>
          <span className="flex items-center gap-1"><Eye size={12} style={{ color: "#10b981" }} /> Pubblicato</span>
          <span className="flex items-center gap-1"><EyeOff size={12} /> Bozza</span>
        </div>
      </div>
    </div>
  );
}
