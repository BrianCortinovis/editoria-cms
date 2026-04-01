export type UserRole = "admin" | "chief_editor" | "editor" | "contributor" | "advertiser";

export type ArticleStatus = "draft" | "in_review" | "approved" | "published" | "archived";

export type BannerPosition = "header" | "sidebar" | "sidebar-left" | "sidebar-right" | "in_article" | "footer" | "interstitial";

export type PageType = "homepage" | "article" | "category" | "tag" | "author" | "search" | "contact" | "about" | "events" | "custom";

export type PlatformMembershipRole = "owner" | "admin" | "editor" | "viewer";

export type SiteStatus = "provisioning" | "active" | "suspended" | "archived" | "deleted";

export type DomainStatus = "pending" | "verifying" | "active" | "failed" | "removed";

export type DomainKind = "platform_subdomain" | "custom" | "redirect";

export type DomainVerificationMethod = "txt" | "cname" | "http" | "manual";

export type SubscriptionStatus = "trialing" | "active" | "past_due" | "canceled" | "paused";

export type NotificationSeverity = "info" | "warning" | "critical";
export type InfrastructureStackKind = "shared" | "dedicated";
export type DeploymentTargetKind = "vercel_managed" | "customer_vps" | "static_bundle";
export type PublishReleaseStatus = "draft" | "building" | "ready" | "active" | "failed" | "rolled_back";
export type PublishJobStatus = "queued" | "running" | "succeeded" | "failed" | "canceled";

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
          is_platform_superadmin: boolean;
          first_name: string | null;
          last_name: string | null;
          avatar_url: string | null;
          bio: string | null;
          social_links: Record<string, string>;
          locale: string;
          timezone: string;
          notification_preferences: Record<string, unknown>;
          security_preferences: Record<string, unknown>;
          onboarding_completed_at: string | null;
          last_seen_at: string | null;
          deleted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string;
          is_platform_superadmin?: boolean;
          first_name?: string | null;
          last_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          social_links?: Record<string, string>;
          locale?: string;
          timezone?: string;
          notification_preferences?: Record<string, unknown>;
          security_preferences?: Record<string, unknown>;
          onboarding_completed_at?: string | null;
          last_seen_at?: string | null;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          email?: string;
          full_name?: string;
          is_platform_superadmin?: boolean;
          first_name?: string | null;
          last_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          social_links?: Record<string, string>;
          locale?: string;
          timezone?: string;
          notification_preferences?: Record<string, unknown>;
          security_preferences?: Record<string, unknown>;
          onboarding_completed_at?: string | null;
          last_seen_at?: string | null;
          deleted_at?: string | null;
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
          parent_id: string | null;
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
          parent_id?: string | null;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          name?: string;
          slug?: string;
          description?: string | null;
          color?: string | null;
          parent_id?: string | null;
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
          legacy_wp_id: number | null;
          legacy_permalink: string | null;
          import_source: string | null;
          imported_at: string | null;
          import_metadata: Record<string, unknown> | null;
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
          legacy_wp_id?: number | null;
          legacy_permalink?: string | null;
          import_source?: string | null;
          imported_at?: string | null;
          import_metadata?: Record<string, unknown> | null;
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
          legacy_wp_id?: number | null;
          legacy_permalink?: string | null;
          import_source?: string | null;
          imported_at?: string | null;
          import_metadata?: Record<string, unknown> | null;
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
      article_categories: {
        Row: {
          article_id: string;
          category_id: string;
          created_at: string;
        };
        Insert: {
          article_id: string;
          category_id: string;
          created_at?: string;
        };
        Update: {
          article_id?: string;
          category_id?: string;
          created_at?: string;
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
      article_comments: {
        Row: {
          id: string;
          tenant_id: string;
          article_id: string;
          parent_id: string | null;
          author_name: string;
          author_email: string;
          author_url: string | null;
          body: string;
          status: string;
          source: string;
          ip_hash: string | null;
          user_agent: string | null;
          is_imported: boolean;
          published_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          article_id: string;
          parent_id?: string | null;
          author_name: string;
          author_email: string;
          author_url?: string | null;
          body: string;
          status?: string;
          source?: string;
          ip_hash?: string | null;
          user_agent?: string | null;
          is_imported?: boolean;
          published_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          parent_id?: string | null;
          author_name?: string;
          author_email?: string;
          author_url?: string | null;
          body?: string;
          status?: string;
          source?: string;
          ip_hash?: string | null;
          user_agent?: string | null;
          is_imported?: boolean;
          published_at?: string | null;
          updated_at?: string;
        };
      };
      article_authors: {
        Row: {
          article_id: string;
          author_id: string;
          role: string;
          sort_order: number;
          is_primary: boolean;
          created_at: string;
        };
        Insert: {
          article_id: string;
          author_id: string;
          role?: string;
          sort_order?: number;
          is_primary?: boolean;
          created_at?: string;
        };
        Update: {
          role?: string;
          sort_order?: number;
          is_primary?: boolean;
          created_at?: string;
        };
      };
      site_forms: {
        Row: {
          id: string;
          tenant_id: string;
          name: string;
          slug: string;
          description: string | null;
          fields: Record<string, unknown>[];
          recipient_emails: string[];
          success_message: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          name: string;
          slug: string;
          description?: string | null;
          fields?: Record<string, unknown>[];
          recipient_emails?: string[];
          success_message?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          slug?: string;
          description?: string | null;
          fields?: Record<string, unknown>[];
          recipient_emails?: string[];
          success_message?: string | null;
          is_active?: boolean;
          updated_at?: string;
        };
      };
      form_submissions: {
        Row: {
          id: string;
          tenant_id: string;
          form_id: string;
          submitter_name: string | null;
          submitter_email: string | null;
          payload: Record<string, unknown>;
          source_page: string | null;
          ip_hash: string | null;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          form_id: string;
          submitter_name?: string | null;
          submitter_email?: string | null;
          payload?: Record<string, unknown>;
          source_page?: string | null;
          ip_hash?: string | null;
          status?: string;
          created_at?: string;
        };
        Update: {
          submitter_name?: string | null;
          submitter_email?: string | null;
          payload?: Record<string, unknown>;
          source_page?: string | null;
          ip_hash?: string | null;
          status?: string;
        };
      };
      redirects: {
        Row: {
          id: string;
          tenant_id: string;
          source_path: string;
          target_path: string;
          status_code: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          source_path: string;
          target_path: string;
          status_code?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          source_path?: string;
          target_path?: string;
          status_code?: number;
          is_active?: boolean;
          updated_at?: string;
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
          rotation_mode: "sequential" | "random" | "weighted";
          rotation_interval_ms: number;
          sizing_mode: "cover" | "contain" | "stretch";
          overlay_enabled: boolean;
          overlay_trigger: "hover" | "click" | "auto";
          overlay_delay_ms: number;
          overlay_close_required: boolean;
          overlay_target_pages: string[];
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
          rotation_mode?: "sequential" | "random" | "weighted";
          rotation_interval_ms?: number;
          sizing_mode?: "cover" | "contain" | "stretch";
          overlay_enabled?: boolean;
          overlay_trigger?: "hover" | "click" | "auto";
          overlay_delay_ms?: number;
          overlay_close_required?: boolean;
          overlay_target_pages?: string[];
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
          parent_id: string | null;
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
          parent_id?: string | null;
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
          parent_id?: string | null;
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
          placement_duration_hours: number | null;
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
          placement_duration_hours?: number | null;
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
          placement_duration_hours?: number | null;
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
          display_mode: "duplicate" | "exclusive";
          expires_at: string | null;
        };
        Insert: {
          id?: string;
          slot_id: string;
          article_id: string;
          tenant_id: string;
          pin_order?: number;
          assigned_by?: string | null;
          assigned_at?: string;
          display_mode?: "duplicate" | "exclusive";
          expires_at?: string | null;
        };
        Update: {
          pin_order?: number;
          assigned_by?: string | null;
          display_mode?: "duplicate" | "exclusive";
          expires_at?: string | null;
        };
      };
      sites: {
        Row: {
          id: string;
          tenant_id: string;
          owner_user_id: string;
          name: string;
          slug: string;
          default_subdomain: string;
          cms_base_path: string;
          status: SiteStatus;
          template_key: string | null;
          language_code: string;
          category: string | null;
          onboarding_state: Record<string, unknown>;
          metadata: Record<string, unknown>;
          archived_at: string | null;
          deleted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          owner_user_id: string;
          name: string;
          slug: string;
          default_subdomain: string;
          cms_base_path?: string;
          status?: SiteStatus;
          template_key?: string | null;
          language_code?: string;
          category?: string | null;
          onboarding_state?: Record<string, unknown>;
          metadata?: Record<string, unknown>;
          archived_at?: string | null;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          slug?: string;
          default_subdomain?: string;
          cms_base_path?: string;
          status?: SiteStatus;
          template_key?: string | null;
          language_code?: string;
          category?: string | null;
          onboarding_state?: Record<string, unknown>;
          metadata?: Record<string, unknown>;
          archived_at?: string | null;
          deleted_at?: string | null;
          updated_at?: string;
        };
      };
      tenant_memberships: {
        Row: {
          id: string;
          tenant_id: string;
          site_id: string;
          user_id: string;
          role: PlatformMembershipRole;
          invited_email: string | null;
          invited_by: string | null;
          joined_at: string | null;
          last_accessed_at: string | null;
          created_at: string;
          updated_at: string;
          revoked_at: string | null;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          site_id: string;
          user_id: string;
          role: PlatformMembershipRole;
          invited_email?: string | null;
          invited_by?: string | null;
          joined_at?: string | null;
          last_accessed_at?: string | null;
          created_at?: string;
          updated_at?: string;
          revoked_at?: string | null;
        };
        Update: {
          role?: PlatformMembershipRole;
          invited_email?: string | null;
          invited_by?: string | null;
          joined_at?: string | null;
          last_accessed_at?: string | null;
          updated_at?: string;
          revoked_at?: string | null;
        };
      };
      site_settings_platform: {
        Row: {
          site_id: string;
          tenant_id: string;
          default_locale: string;
          timezone: string;
          onboarding_checklist: Record<string, unknown>;
          feature_flags: Record<string, unknown>;
          notification_settings: Record<string, unknown>;
          billing_state: Record<string, unknown>;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          site_id: string;
          tenant_id: string;
          default_locale?: string;
          timezone?: string;
          onboarding_checklist?: Record<string, unknown>;
          feature_flags?: Record<string, unknown>;
          notification_settings?: Record<string, unknown>;
          billing_state?: Record<string, unknown>;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          default_locale?: string;
          timezone?: string;
          onboarding_checklist?: Record<string, unknown>;
          feature_flags?: Record<string, unknown>;
          notification_settings?: Record<string, unknown>;
          billing_state?: Record<string, unknown>;
          updated_at?: string;
        };
      };
      site_domains: {
        Row: {
          id: string;
          site_id: string;
          tenant_id: string;
          hostname: string;
          kind: DomainKind;
          is_primary: boolean;
          status: DomainStatus;
          verification_method: DomainVerificationMethod;
          verification_token: string | null;
          verification_instructions: unknown[];
          dns_records: unknown[];
          ssl_status: string;
          redirect_www: boolean;
          attached_at: string | null;
          last_verified_at: string | null;
          removed_at: string | null;
          metadata: Record<string, unknown>;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          site_id: string;
          tenant_id: string;
          hostname: string;
          kind: DomainKind;
          is_primary?: boolean;
          status?: DomainStatus;
          verification_method?: DomainVerificationMethod;
          verification_token?: string | null;
          verification_instructions?: unknown[];
          dns_records?: unknown[];
          ssl_status?: string;
          redirect_www?: boolean;
          attached_at?: string | null;
          last_verified_at?: string | null;
          removed_at?: string | null;
          metadata?: Record<string, unknown>;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          hostname?: string;
          kind?: DomainKind;
          is_primary?: boolean;
          status?: DomainStatus;
          verification_method?: DomainVerificationMethod;
          verification_token?: string | null;
          verification_instructions?: unknown[];
          dns_records?: unknown[];
          ssl_status?: string;
          redirect_www?: boolean;
          attached_at?: string | null;
          last_verified_at?: string | null;
          removed_at?: string | null;
          metadata?: Record<string, unknown>;
          updated_at?: string;
        };
      };
      domain_verification_events: {
        Row: {
          id: string;
          site_domain_id: string;
          site_id: string;
          tenant_id: string;
          event_type: string;
          provider: string;
          status: DomainStatus;
          payload: Record<string, unknown>;
          created_at: string;
        };
        Insert: {
          id?: string;
          site_domain_id: string;
          site_id: string;
          tenant_id: string;
          event_type: string;
          provider: string;
          status: DomainStatus;
          payload?: Record<string, unknown>;
          created_at?: string;
        };
        Update: {
          event_type?: string;
          provider?: string;
          status?: DomainStatus;
          payload?: Record<string, unknown>;
        };
      };
      subscriptions: {
        Row: {
          id: string;
          site_id: string;
          tenant_id: string;
          provider: string;
          plan_code: string;
          status: SubscriptionStatus;
          external_customer_id: string | null;
          external_subscription_id: string | null;
          trial_ends_at: string | null;
          current_period_ends_at: string | null;
          limits: Record<string, unknown>;
          metadata: Record<string, unknown>;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          site_id: string;
          tenant_id: string;
          provider?: string;
          plan_code?: string;
          status?: SubscriptionStatus;
          external_customer_id?: string | null;
          external_subscription_id?: string | null;
          trial_ends_at?: string | null;
          current_period_ends_at?: string | null;
          limits?: Record<string, unknown>;
          metadata?: Record<string, unknown>;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          provider?: string;
          plan_code?: string;
          status?: SubscriptionStatus;
          external_customer_id?: string | null;
          external_subscription_id?: string | null;
          trial_ends_at?: string | null;
          current_period_ends_at?: string | null;
          limits?: Record<string, unknown>;
          metadata?: Record<string, unknown>;
          updated_at?: string;
        };
      };
      usage_metrics: {
        Row: {
          id: string;
          site_id: string;
          tenant_id: string;
          metric_key: string;
          window_start: string;
          window_end: string;
          metric_value: number;
          metadata: Record<string, unknown>;
          created_at: string;
        };
        Insert: {
          id?: string;
          site_id: string;
          tenant_id: string;
          metric_key: string;
          window_start: string;
          window_end: string;
          metric_value?: number;
          metadata?: Record<string, unknown>;
          created_at?: string;
        };
        Update: {
          metric_key?: string;
          window_start?: string;
          window_end?: string;
          metric_value?: number;
          metadata?: Record<string, unknown>;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          tenant_id: string | null;
          site_id: string | null;
          type: string;
          severity: NotificationSeverity;
          title: string;
          body: string;
          data: Record<string, unknown>;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          tenant_id?: string | null;
          site_id?: string | null;
          type: string;
          severity?: NotificationSeverity;
          title: string;
          body: string;
          data?: Record<string, unknown>;
          read_at?: string | null;
          created_at?: string;
        };
        Update: {
          type?: string;
          severity?: NotificationSeverity;
          title?: string;
          body?: string;
          data?: Record<string, unknown>;
          read_at?: string | null;
        };
      };
      audit_logs: {
        Row: {
          id: string;
          actor_user_id: string | null;
          tenant_id: string | null;
          site_id: string | null;
          action: string;
          resource_type: string;
          resource_id: string | null;
          ip_address: string | null;
          user_agent: string | null;
          request_id: string | null;
          metadata: Record<string, unknown>;
          created_at: string;
        };
        Insert: {
          id?: string;
          actor_user_id?: string | null;
          tenant_id?: string | null;
          site_id?: string | null;
          action: string;
          resource_type: string;
          resource_id?: string | null;
          ip_address?: string | null;
          user_agent?: string | null;
          request_id?: string | null;
          metadata?: Record<string, unknown>;
          created_at?: string;
        };
        Update: {
          action?: string;
          resource_type?: string;
          resource_id?: string | null;
          ip_address?: string | null;
          user_agent?: string | null;
          request_id?: string | null;
          metadata?: Record<string, unknown>;
        };
      };
      active_sessions: {
        Row: {
          id: string;
          user_id: string;
          session_token_hash: string;
          ip_address: string | null;
          user_agent: string | null;
          last_activity_at: string;
          expires_at: string;
          revoked_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          session_token_hash: string;
          ip_address?: string | null;
          user_agent?: string | null;
          last_activity_at?: string;
          expires_at: string;
          revoked_at?: string | null;
          created_at?: string;
        };
        Update: {
          session_token_hash?: string;
          ip_address?: string | null;
          user_agent?: string | null;
          last_activity_at?: string;
          expires_at?: string;
          revoked_at?: string | null;
        };
      };
      site_infrastructure: {
        Row: {
          site_id: string;
          tenant_id: string;
          stack_kind: InfrastructureStackKind;
          supabase_project_ref: string | null;
          supabase_url: string | null;
          deploy_target_kind: DeploymentTargetKind;
          deploy_target_label: string | null;
          public_base_url: string | null;
          media_storage_label: string | null;
          publish_strategy: string;
          config: Record<string, unknown>;
          last_publish_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          site_id: string;
          tenant_id: string;
          stack_kind?: InfrastructureStackKind;
          supabase_project_ref?: string | null;
          supabase_url?: string | null;
          deploy_target_kind?: DeploymentTargetKind;
          deploy_target_label?: string | null;
          public_base_url?: string | null;
          media_storage_label?: string | null;
          publish_strategy?: string;
          config?: Record<string, unknown>;
          last_publish_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          stack_kind?: InfrastructureStackKind;
          supabase_project_ref?: string | null;
          supabase_url?: string | null;
          deploy_target_kind?: DeploymentTargetKind;
          deploy_target_label?: string | null;
          public_base_url?: string | null;
          media_storage_label?: string | null;
          publish_strategy?: string;
          config?: Record<string, unknown>;
          last_publish_at?: string | null;
          updated_at?: string;
        };
      };
      deploy_targets: {
        Row: {
          id: string;
          site_id: string;
          tenant_id: string;
          kind: DeploymentTargetKind;
          label: string;
          hostname: string | null;
          is_active: boolean;
          config: Record<string, unknown>;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          site_id: string;
          tenant_id: string;
          kind: DeploymentTargetKind;
          label: string;
          hostname?: string | null;
          is_active?: boolean;
          config?: Record<string, unknown>;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          kind?: DeploymentTargetKind;
          label?: string;
          hostname?: string | null;
          is_active?: boolean;
          config?: Record<string, unknown>;
          updated_at?: string;
        };
      };
      publish_releases: {
        Row: {
          id: string;
          site_id: string;
          tenant_id: string;
          version_label: string;
          status: PublishReleaseStatus;
          manifest_path: string | null;
          payload_checksum: string | null;
          created_by: string | null;
          activated_at: string | null;
          rolled_back_from_release_id: string | null;
          metadata: Record<string, unknown>;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          site_id: string;
          tenant_id: string;
          version_label: string;
          status?: PublishReleaseStatus;
          manifest_path?: string | null;
          payload_checksum?: string | null;
          created_by?: string | null;
          activated_at?: string | null;
          rolled_back_from_release_id?: string | null;
          metadata?: Record<string, unknown>;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          version_label?: string;
          status?: PublishReleaseStatus;
          manifest_path?: string | null;
          payload_checksum?: string | null;
          created_by?: string | null;
          activated_at?: string | null;
          rolled_back_from_release_id?: string | null;
          metadata?: Record<string, unknown>;
          updated_at?: string;
        };
      };
      publish_jobs: {
        Row: {
          id: string;
          site_id: string;
          tenant_id: string;
          release_id: string | null;
          job_type: string;
          status: PublishJobStatus;
          started_at: string | null;
          finished_at: string | null;
          error_message: string | null;
          metadata: Record<string, unknown>;
          created_at: string;
        };
        Insert: {
          id?: string;
          site_id: string;
          tenant_id: string;
          release_id?: string | null;
          job_type: string;
          status?: PublishJobStatus;
          started_at?: string | null;
          finished_at?: string | null;
          error_message?: string | null;
          metadata?: Record<string, unknown>;
          created_at?: string;
        };
        Update: {
          release_id?: string | null;
          job_type?: string;
          status?: PublishJobStatus;
          started_at?: string | null;
          finished_at?: string | null;
          error_message?: string | null;
          metadata?: Record<string, unknown>;
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
      platform_membership_role: PlatformMembershipRole;
      site_status: SiteStatus;
      domain_status: DomainStatus;
      domain_kind: DomainKind;
      domain_verification_method: DomainVerificationMethod;
      subscription_status: SubscriptionStatus;
      notification_severity: NotificationSeverity;
      infrastructure_stack_kind: InfrastructureStackKind;
      deployment_target_kind: DeploymentTargetKind;
      publish_release_status: PublishReleaseStatus;
      publish_job_status: PublishJobStatus;
    };
  };
}

// Helper types
export type Tables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"];
export type InsertTables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Insert"];
export type UpdateTables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Update"];
