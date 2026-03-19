'use client';

/**
 * React hooks per l'SDK Editoria.
 * Opzionali — per siti custom React/Next.js.
 *
 * ```tsx
 * import { EditoriaProvider, useArticles } from '@/lib/sdk/react'
 *
 * function App() {
 *   return (
 *     <EditoriaProvider tenant="mia-testata" baseUrl="https://cms.example.com">
 *       <ArticleList />
 *     </EditoriaProvider>
 *   )
 * }
 * ```
 */

import { createContext, useContext, useRef, useState, useEffect, useCallback, type ReactNode } from 'react';
import { createEditoria } from './client';
import type {
  EditoriaClient,
  EditoriaConfig,
  Article,
  Category,
  Tag,
  Banner,
  BreakingNews,
  SiteEvent,
  SiteConfig,
  PaginatedResponse,
  ArticleFilters,
  BannerFilters,
} from './types';

// --- Context ---

const EditoriaContext = createContext<EditoriaClient | null>(null);

interface ProviderProps extends Omit<EditoriaConfig, 'fetcher'> {
  children: ReactNode;
}

export function EditoriaProvider({ children, ...config }: ProviderProps) {
  const clientRef = useRef<EditoriaClient | null>(null);
  if (!clientRef.current) {
    clientRef.current = createEditoria(config);
  }
  return (
    <EditoriaContext.Provider value={clientRef.current}>
      {children}
    </EditoriaContext.Provider>
  );
}

export function useEditoria(): EditoriaClient {
  const client = useContext(EditoriaContext);
  if (!client) throw new Error('useEditoria must be used inside <EditoriaProvider>');
  return client;
}

// --- Generic hook ---

interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

function useAsync<T>(fn: () => Promise<T>, deps: unknown[]): AsyncState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [tick, setTick] = useState(0);

  const refetch = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fn()
      .then((result) => { if (!cancelled) setData(result); })
      .catch((err) => { if (!cancelled) setError(err); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick, ...deps]);

  return { data, loading, error, refetch };
}

// --- Domain hooks ---

export function useArticles(filters?: ArticleFilters): AsyncState<PaginatedResponse<Article>> {
  const cms = useEditoria();
  return useAsync(() => cms.articles.list(filters), [JSON.stringify(filters)]);
}

export function useArticle(slug: string): AsyncState<Article | null> {
  const cms = useEditoria();
  return useAsync(() => cms.articles.get(slug), [slug]);
}

export function useRelatedArticles(slug: string, limit = 5): AsyncState<Article[]> {
  const cms = useEditoria();
  return useAsync(() => cms.articles.related(slug, limit), [slug, limit]);
}

export function useCategories(): AsyncState<Category[]> {
  const cms = useEditoria();
  return useAsync(() => cms.categories.list(), []);
}

export function useTags(): AsyncState<Tag[]> {
  const cms = useEditoria();
  return useAsync(() => cms.tags.list(), []);
}

export function useBanners(filters?: BannerFilters): AsyncState<Banner[]> {
  const cms = useEditoria();
  return useAsync(() => cms.banners.list(filters), [JSON.stringify(filters)]);
}

export function useBreakingNews(): AsyncState<BreakingNews[]> {
  const cms = useEditoria();
  return useAsync(() => cms.breakingNews.list(), []);
}

export function useEvents(limit?: number): AsyncState<SiteEvent[]> {
  const cms = useEditoria();
  return useAsync(() => cms.events.list(limit), [limit]);
}

export function useSiteConfig(): AsyncState<SiteConfig> {
  const cms = useEditoria();
  return useAsync(() => cms.site.config(), []);
}

export function useSearch(query: string, options?: { ai?: boolean; limit?: number }) {
  const cms = useEditoria();
  return useAsync(
    () => query.length >= 2 ? cms.search.query(query, options) : Promise.resolve({ articles: [], total: 0 }),
    [query, JSON.stringify(options)]
  );
}
