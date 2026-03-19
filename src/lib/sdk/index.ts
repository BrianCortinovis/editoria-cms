/**
 * @editoria/sdk — Headless SDK per siti custom
 * Zero-deps, tree-shakeable, funziona con qualsiasi framework.
 *
 * Uso:
 *   import { createEditoria } from '@/lib/sdk'
 *   const cms = createEditoria({ tenant: 'mia-testata', baseUrl: 'https://cms.example.com' })
 *   const articles = await cms.articles.list({ limit: 10 })
 */

export { createEditoria } from './client';
export type {
  EditoriaConfig,
  EditoriaClient,
  Article,
  Category,
  Tag,
  Banner,
  BreakingNews,
  SiteEvent,
  SitePage,
  SiteConfig,
  SearchResult,
  PaginatedResponse,
  ArticleFilters,
  BannerFilters,
} from './types';
