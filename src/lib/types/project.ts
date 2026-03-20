import type { Block } from './block';

export interface ProjectSettings {
  defaultFont: string;
  colorPalette: string[];
  favicon?: string;
  language: string;
  customHead?: string;
}

export interface PageReference {
  id: string;
  title: string;
  slug: string;
  isHomepage: boolean;
  order: number;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  settings: ProjectSettings;
  pages: PageReference[];
}

export interface PageMeta {
  description: string;
  ogImage?: string;
  keywords: string[];
}

export interface PageData {
  id: string;
  title: string;
  slug: string;
  meta: PageMeta;
  blocks: Block[];
  customCss?: string;
  customJs?: string;
}

export interface ProjectSummary {
  id: string;
  name: string;
  description: string;
  updatedAt: string;
  pageCount: number;
  thumbnail?: string;
}
