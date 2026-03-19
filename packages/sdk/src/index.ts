import { EditoriaClient } from './client';
import type { EditoriaConfig } from './types';

/**
 * Create an Editoria CMS client.
 *
 * @example
 * ```ts
 * import { createClient } from '@editoria/sdk';
 *
 * const cms = createClient({
 *   baseUrl: 'https://cms.example.com/api/v1',
 *   tenant: 'mio-giornale',
 *   apiKey: 'ek_live_...', // optional
 * });
 *
 * const { articles } = await cms.articles.list({ limit: 10 });
 * const { article } = await cms.articles.getBySlug('titolo-articolo');
 * const { categories } = await cms.categories.list();
 * ```
 */
export function createClient(config: EditoriaConfig): EditoriaClient {
  return new EditoriaClient(config);
}

// Re-export types
export type {
  EditoriaConfig,
  Article,
  Category,
  Tag,
  Event,
  Banner,
  BreakingNews,
  SitePage,
  SiteInfo,
  ListParams,
} from './types';

export { EditoriaClient } from './client';
export { FetchError } from './utils/fetch';
