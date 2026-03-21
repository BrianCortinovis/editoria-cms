export type UserRole = "super_admin" | "chief_editor" | "editor" | "contributor" | "advertiser";

export type ArticleStatus = "draft" | "in_review" | "approved" | "published" | "archived";

export type BannerPosition = "header" | "sidebar" | "in_article" | "footer" | "interstitial";

export type PageType = "homepage" | "article" | "category" | "tag" | "author" | "search" | "contact" | "about" | "events" | "custom";

export interface SiteTheme {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
  };
  fonts: {
    heading: string;
    body: string;
    mono: string;
  };
  spacing: {
    unit: number;
    containerMax: string;
    sectionGap: string;
  };
  borderRadius: string;
}

export interface NavItem {
  label: string;
  url: string;
  children?: NavItem[];
}

export interface SiteFooter {
  columns: { title: string; links: { label: string; url: string }[] }[];
  copyright: string;
  links: { label: string; url: string }[];
}

export interface Database {
  public: {
    Tables: {
      tenants: {
        Row: {
          id: string;
          name: string;
          slug: string;
          domain: string | null;
          logo_url: string | null;
          theme_config: Record<string, unknown>;
          settings: Record<string, unknown>;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          domain?: string | null;
          logo_url?: string | null;
          theme_config?: Record<string, unknown>;
          settings?: Record<string, unknown>;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          slug?: string;
          domain?: string | null;
          logo_url?: string | null;
          theme_config?: Record<string, unknown>;
          settings?: Record<string, unknown>;
        };
      };
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          avatar_url: string | null;
          bio: string | null;
          social_links: Record<string, string>;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string;
          avatar_url?: string | null;
          bio?: string | null;
          social_links?: Record<string, string>;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          email?: string;
          full_name?: string;
          avatar_url?: string | null;
          bio?: string | null;
          social_links?: Record<string, string>;
        };
      };
      user_tenants: {
        Row: {
          id: string;
          user_id: string;
          tenant_id: string;
          role: UserRole;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          tenant_id: string;
          role?: UserRole;
          created_at?: string;
        };
        Update: {
          role?: UserRole;
        };
      };
      categories: {
        Row: {
          id: string;
          tenant_id: string;
          name: string;
          slug: string;
          description: string | null;
          color: string | null;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          name: string;
          slug: string;
          description?: string | null;
          color?: string | null;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          name?: string;
          slug?: string;
          description?: string | null;
          color?: string | null;
          sort_order?: number;
        };
      };
      tags: {
        Row: {
          id: string;
          tenant_id: string;
          name: string;
          slug: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          name: string;
          slug: string;
          created_at?: string;
        };
        Update: {
          name?: string;
          slug?: string;
        };
      };
      articles: {
        Row: {
          id: string;
          tenant_id: string;
          title: string;
          subtitle: string | null;
          slug: string;
          summary: string | null;
          body: string;
          cover_image_url: string | null;
          category_id: string | null;
          author_id: string;
          status: ArticleStatus;
          is_featured: boolean;
          is_breaking: boolean;
          is_premium: boolean;
          homepage_position: number | null;
          meta_title: string | null;
          meta_description: string | null;
          og_image_url: string | null;
          reading_time_minutes: number;
          view_count: number;
          published_at: string | null;
          scheduled_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          title: string;
          subtitle?: string | null;
          slug: string;
          summary?: string | null;
          body?: string;
          cover_image_url?: string | null;
          category_id?: string | null;
          author_id: string;
          status?: ArticleStatus;
          is_featured?: boolean;
          is_breaking?: boolean;
          is_premium?: boolean;
          homepage_position?: number | null;
          meta_title?: string | null;
          meta_description?: string | null;
          og_image_url?: string | null;
          published_at?: string | null;
          scheduled_at?: string | null;
        };
        Update: {
          title?: string;
          subtitle?: string | null;
          slug?: string;
          summary?: string | null;
          body?: string;
          cover_image_url?: string | null;
          category_id?: string | null;
          status?: ArticleStatus;
          is_featured?: boolean;
          is_breaking?: boolean;
          is_premium?: boolean;
          homepage_position?: number | null;
          meta_title?: string | null;
          meta_description?: string | null;
          og_image_url?: string | null;
          published_at?: string | null;
          scheduled_at?: string | null;
        };
      };
      article_tags: {
        Row: {
          article_id: string;
          tag_id: string;
        };
        Insert: {
          article_id: string;
          tag_id: string;
        };
        Update: {
          article_id?: string;
          tag_id?: string;
        };
      };
      article_revisions: {
        Row: {
          id: string;
          article_id: string;
          title: string;
          body: string;
          changed_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          article_id: string;
          title: string;
          body: string;
          changed_by: string;
          created_at?: string;
        };
        Update: {
          title?: string;
          body?: string;
        };
      };
      media: {
        Row: {
          id: string;
          tenant_id: string;
          filename: string;
          original_filename: string;
          mime_type: string;
          size_bytes: number;
          width: number | null;
          height: number | null;
          url: string;
          thumbnail_url: string | null;
          alt_text: string | null;
          folder: string | null;
          uploaded_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          filename: string;
          original_filename: string;
          mime_type: string;
          size_bytes?: number;
          width?: number | null;
          height?: number | null;
          url: string;
          thumbnail_url?: string | null;
          alt_text?: string | null;
          folder?: string | null;
          uploaded_by: string;
          created_at?: string;
        };
        Update: {
          alt_text?: string | null;
          folder?: string | null;
        };
      };
      banners: {
        Row: {
          id: string;
          tenant_id: string;
          name: string;
          position: BannerPosition;
          type: "image" | "html" | "adsense";
          image_url: string | null;
          html_content: string | null;
          link_url: string | null;
          target_categories: string[];
          target_device: "all" | "desktop" | "mobile";
          weight: number;
          impressions: number;
          clicks: number;
          advertiser_id: string | null;
          starts_at: string | null;
          ends_at: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          name: string;
          position?: BannerPosition;
          type?: "image" | "html" | "adsense";
          image_url?: string | null;
          html_content?: string | null;
          link_url?: string | null;
          target_categories?: string[];
          target_device?: "all" | "desktop" | "mobile";
          weight?: number;
          advertiser_id?: string | null;
          starts_at?: string | null;
          ends_at?: string | null;
          is_active?: boolean;
        };
        Update: {
          name?: string;
          position?: BannerPosition;
          type?: "image" | "html" | "adsense";
          image_url?: string | null;
          html_content?: string | null;
          link_url?: string | null;
          target_categories?: string[];
          target_device?: "all" | "desktop" | "mobile";
          weight?: number;
          advertiser_id?: string | null;
          starts_at?: string | null;
          ends_at?: string | null;
          is_active?: boolean;
        };
      };
      events: {
        Row: {
          id: string;
          tenant_id: string;
          title: string;
          description: string | null;
          location: string | null;
          image_url: string | null;
          category: string | null;
          price: string | null;
          ticket_url: string | null;
          starts_at: string;
          ends_at: string | null;
          is_recurring: boolean;
          recurrence_rule: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          title: string;
          description?: string | null;
          location?: string | null;
          image_url?: string | null;
          category?: string | null;
          price?: string | null;
          ticket_url?: string | null;
          starts_at: string;
          ends_at?: string | null;
          is_recurring?: boolean;
          recurrence_rule?: string | null;
        };
        Update: {
          title?: string;
          description?: string | null;
          location?: string | null;
          image_url?: string | null;
          category?: string | null;
          price?: string | null;
          ticket_url?: string | null;
          starts_at?: string;
          ends_at?: string | null;
          is_recurring?: boolean;
          recurrence_rule?: string | null;
        };
      };
      breaking_news: {
        Row: {
          id: string;
          tenant_id: string;
          text: string;
          link_url: string | null;
          is_active: boolean;
          priority: number;
          created_by: string;
          created_at: string;
          expires_at: string | null;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          text: string;
          link_url?: string | null;
          is_active?: boolean;
          priority?: number;
          created_by: string;
          expires_at?: string | null;
        };
        Update: {
          text?: string;
          link_url?: string | null;
          is_active?: boolean;
          priority?: number;
          expires_at?: string | null;
        };
      };
      advertisers: {
        Row: {
          id: string;
          tenant_id: string;
          name: string;
          email: string | null;
          phone: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          name: string;
          email?: string | null;
          phone?: string | null;
          notes?: string | null;
        };
        Update: {
          name?: string;
          email?: string | null;
          phone?: string | null;
          notes?: string | null;
        };
      };
      activity_log: {
        Row: {
          id: string;
          tenant_id: string;
          user_id: string;
          action: string;
          entity_type: string;
          entity_id: string | null;
          details: Record<string, unknown> | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          user_id: string;
          action: string;
          entity_type: string;
          entity_id?: string | null;
          details?: Record<string, unknown> | null;
        };
        Update: Record<string, never>;
      };
      site_config: {
        Row: {
          id: string;
          tenant_id: string;
          theme: SiteTheme;
          navigation: NavItem[];
          footer: SiteFooter;
          global_css: string | null;
          global_head: string | null;
          favicon_url: string | null;
          og_defaults: Record<string, unknown>;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          theme?: SiteTheme;
          navigation?: NavItem[];
          footer?: SiteFooter;
          global_css?: string | null;
          global_head?: string | null;
          favicon_url?: string | null;
          og_defaults?: Record<string, unknown>;
        };
        Update: {
          theme?: SiteTheme;
          navigation?: NavItem[];
          footer?: SiteFooter;
          global_css?: string | null;
          global_head?: string | null;
          favicon_url?: string | null;
          og_defaults?: Record<string, unknown>;
        };
      };
      site_pages: {
        Row: {
          id: string;
          tenant_id: string;
          title: string;
          slug: string;
          page_type: PageType;
          meta: Record<string, unknown>;
          blocks: unknown[];
          custom_css: string | null;
          is_published: boolean;
          sort_order: number;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          title: string;
          slug: string;
          page_type?: PageType;
          meta?: Record<string, unknown>;
          blocks?: unknown[];
          custom_css?: string | null;
          is_published?: boolean;
          sort_order?: number;
          created_by?: string | null;
        };
        Update: {
          title?: string;
          slug?: string;
          page_type?: PageType;
          meta?: Record<string, unknown>;
          blocks?: unknown[];
          custom_css?: string | null;
          is_published?: boolean;
          sort_order?: number;
        };
      };
      site_page_revisions: {
        Row: {
          id: string;
          page_id: string;
          blocks: unknown[];
          meta: Record<string, unknown> | null;
          changed_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          page_id: string;
          blocks: unknown[];
          meta?: Record<string, unknown> | null;
          changed_by: string;
        };
        Update: Record<string, never>;
      };
      api_keys: {
        Row: {
          id: string;
          tenant_id: string;
          name: string;
          key_hash: string;
          key_prefix: string;
          permissions: string[];
          rate_limit: number;
          last_used_at: string | null;
          expires_at: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          name: string;
          key_hash: string;
          key_prefix: string;
          permissions?: string[];
          rate_limit?: number;
          expires_at?: string | null;
          is_active?: boolean;
        };
        Update: {
          name?: string;
          permissions?: string[];
          rate_limit?: number;
          expires_at?: string | null;
          is_active?: boolean;
        };
      };
      layout_templates: {
        Row: {
          id: string;
          tenant_id: string;
          page_type: string;
          name: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          page_type: string;
          name: string;
          is_active?: boolean;
        };
        Update: {
          page_type?: string;
          name?: string;
          is_active?: boolean;
        };
      };
      layout_slots: {
        Row: {
          id: string;
          template_id: string;
          slot_key: string;
          label: string;
          description: string | null;
          content_type: string;
          category_id: string | null;
          max_items: number;
          sort_by: string;
          sort_order: string;
          sort_index: number;
          layout_width: string;
          layout_height: string;
          layout_grid_cols: number;
          layout_display: string;
          assignment_mode: "auto" | "manual" | "mixed";
          created_at: string;
        };
        Insert: {
          id?: string;
          template_id: string;
          slot_key: string;
          label: string;
          description?: string | null;
          content_type?: string;
          category_id?: string | null;
          max_items?: number;
          sort_by?: string;
          sort_order?: string;
          sort_index?: number;
          layout_width?: string;
          layout_height?: string;
          layout_grid_cols?: number;
          layout_display?: string;
          assignment_mode?: "auto" | "manual" | "mixed";
        };
        Update: {
          slot_key?: string;
          label?: string;
          description?: string | null;
          content_type?: string;
          category_id?: string | null;
          max_items?: number;
          sort_by?: string;
          sort_order?: string;
          sort_index?: number;
          layout_width?: string;
          layout_height?: string;
          layout_grid_cols?: number;
          layout_display?: string;
          assignment_mode?: "auto" | "manual" | "mixed";
        };
      };
      slot_assignments: {
        Row: {
          id: string;
          slot_id: string;
          article_id: string;
          tenant_id: string;
          pin_order: number;
          assigned_by: string | null;
          assigned_at: string;
        };
        Insert: {
          id?: string;
          slot_id: string;
          article_id: string;
          tenant_id: string;
          pin_order?: number;
          assigned_by?: string | null;
          assigned_at?: string;
        };
        Update: {
          pin_order?: number;
          assigned_by?: string | null;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      user_role: UserRole;
      article_status: ArticleStatus;
      banner_position: BannerPosition;
      page_type: PageType;
    };
  };
}

// Helper types
export type Tables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"];
export type InsertTables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Insert"];
export type UpdateTables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Update"];
