-- ============================================
-- EDITORIA CMS - Schema Multi-Tenant
-- ============================================

-- Enums
CREATE TYPE user_role AS ENUM ('admin', 'chief_editor', 'editor', 'contributor', 'advertiser');
CREATE TYPE article_status AS ENUM ('draft', 'in_review', 'approved', 'published', 'archived');
CREATE TYPE banner_position AS ENUM ('header', 'sidebar', 'in_article', 'footer', 'interstitial');
CREATE TYPE banner_type AS ENUM ('image', 'html', 'adsense');
CREATE TYPE device_target AS ENUM ('all', 'desktop', 'mobile');

-- ============================================
-- TENANTS (Testate giornalistiche)
-- ============================================
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  domain TEXT UNIQUE,
  logo_url TEXT,
  theme_config JSONB NOT NULL DEFAULT '{}',
  settings JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- PROFILES (Utenti/Redattori)
-- ============================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  bio TEXT,
  social_links JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- USER_TENANTS (Relazione utenti-testate con ruolo)
-- ============================================
CREATE TABLE user_tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'contributor',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, tenant_id)
);

-- ============================================
-- CATEGORIES
-- ============================================
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#8B0000',
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, slug)
);

-- ============================================
-- TAGS
-- ============================================
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, slug)
);

-- ============================================
-- ARTICLES
-- ============================================
CREATE TABLE articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  subtitle TEXT,
  slug TEXT NOT NULL,
  summary TEXT,
  body TEXT NOT NULL DEFAULT '',
  cover_image_url TEXT,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  author_id UUID NOT NULL REFERENCES profiles(id),
  status article_status NOT NULL DEFAULT 'draft',
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_breaking BOOLEAN NOT NULL DEFAULT false,
  is_premium BOOLEAN NOT NULL DEFAULT false,
  homepage_position INT,
  meta_title TEXT,
  meta_description TEXT,
  og_image_url TEXT,
  reading_time_minutes INT NOT NULL DEFAULT 1,
  view_count INT NOT NULL DEFAULT 0,
  published_at TIMESTAMPTZ,
  scheduled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, slug)
);

CREATE INDEX idx_articles_tenant_status ON articles(tenant_id, status);
CREATE INDEX idx_articles_tenant_published ON articles(tenant_id, published_at DESC) WHERE status = 'published';
CREATE INDEX idx_articles_tenant_featured ON articles(tenant_id) WHERE is_featured = true AND status = 'published';
CREATE INDEX idx_articles_category ON articles(category_id);
CREATE INDEX idx_articles_author ON articles(author_id);

-- ============================================
-- ARTICLE_TAGS (N:N)
-- ============================================
CREATE TABLE article_tags (
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (article_id, tag_id)
);

-- ============================================
-- ARTICLE_REVISIONS (Storico versioni)
-- ============================================
CREATE TABLE article_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  changed_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_revisions_article ON article_revisions(article_id, created_at DESC);

-- ============================================
-- MEDIA LIBRARY
-- ============================================
CREATE TABLE media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes BIGINT NOT NULL DEFAULT 0,
  width INT,
  height INT,
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  alt_text TEXT,
  folder TEXT,
  uploaded_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_media_tenant ON media(tenant_id, created_at DESC);
CREATE INDEX idx_media_folder ON media(tenant_id, folder);

-- ============================================
-- BANNERS PUBBLICITARI
-- ============================================
CREATE TABLE advertisers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  position banner_position NOT NULL DEFAULT 'sidebar',
  type banner_type NOT NULL DEFAULT 'image',
  image_url TEXT,
  html_content TEXT,
  link_url TEXT,
  target_categories TEXT[] NOT NULL DEFAULT '{}',
  target_device device_target NOT NULL DEFAULT 'all',
  weight INT NOT NULL DEFAULT 1,
  impressions INT NOT NULL DEFAULT 0,
  clicks INT NOT NULL DEFAULT 0,
  advertiser_id UUID REFERENCES advertisers(id) ON DELETE SET NULL,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_banners_active ON banners(tenant_id, position, is_active) WHERE is_active = true;

-- ============================================
-- EVENTS
-- ============================================
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  image_url TEXT,
  category TEXT,
  price TEXT,
  ticket_url TEXT,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ,
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  recurrence_rule TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_events_upcoming ON events(tenant_id, starts_at) WHERE starts_at > now();

-- ============================================
-- BREAKING NEWS
-- ============================================
CREATE TABLE breaking_news (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  link_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  priority INT NOT NULL DEFAULT 0,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ
);

CREATE INDEX idx_breaking_active ON breaking_news(tenant_id) WHERE is_active = true;

-- ============================================
-- ACTIVITY LOG (Audit trail)
-- ============================================
CREATE TABLE activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_activity_tenant ON activity_log(tenant_id, created_at DESC);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_tenants_updated_at BEFORE UPDATE ON tenants FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_articles_updated_at BEFORE UPDATE ON articles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_banners_updated_at BEFORE UPDATE ON banners FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_events_updated_at BEFORE UPDATE ON events FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Calculate reading time (words / 200 wpm)
CREATE OR REPLACE FUNCTION calculate_reading_time()
RETURNS TRIGGER AS $$
BEGIN
  NEW.reading_time_minutes = GREATEST(1, array_length(string_to_array(regexp_replace(NEW.body, '<[^>]*>', '', 'g'), ' '), 1) / 200);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_articles_reading_time BEFORE INSERT OR UPDATE OF body ON articles FOR EACH ROW EXECUTE FUNCTION calculate_reading_time();

-- Auto-create profile on auth signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE media ENABLE ROW LEVEL SECURITY;
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE advertisers ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE breaking_news ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- Helper: get user's tenant IDs
CREATE OR REPLACE FUNCTION get_user_tenant_ids()
RETURNS SETOF UUID AS $$
  SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper: get user's role for a tenant
CREATE OR REPLACE FUNCTION get_user_role(p_tenant_id UUID)
RETURNS user_role AS $$
  SELECT role FROM user_tenants WHERE user_id = auth.uid() AND tenant_id = p_tenant_id LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- TENANTS: users can see their own tenants
CREATE POLICY "Users can view own tenants" ON tenants
  FOR SELECT USING (id IN (SELECT get_user_tenant_ids()));

CREATE POLICY "Super admins can update tenants" ON tenants
  FOR UPDATE USING (get_user_role(id) = 'admin');

-- PROFILES: viewable by same tenant members
CREATE POLICY "Profiles are viewable by authenticated users" ON profiles
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (id = auth.uid());

-- USER_TENANTS: visible to same tenant members
CREATE POLICY "Users can view own tenant memberships" ON user_tenants
  FOR SELECT USING (tenant_id IN (SELECT get_user_tenant_ids()));

CREATE POLICY "Super admins can manage tenant members" ON user_tenants
  FOR ALL USING (get_user_role(tenant_id) = 'admin');

-- CATEGORIES: visible to tenant members, editable by editors+
CREATE POLICY "Categories visible to tenant members" ON categories
  FOR SELECT USING (tenant_id IN (SELECT get_user_tenant_ids()));

CREATE POLICY "Editors+ can manage categories" ON categories
  FOR ALL USING (get_user_role(tenant_id) IN ('admin', 'chief_editor', 'editor'));

-- TAGS: same as categories
CREATE POLICY "Tags visible to tenant members" ON tags
  FOR SELECT USING (tenant_id IN (SELECT get_user_tenant_ids()));

CREATE POLICY "Editors+ can manage tags" ON tags
  FOR ALL USING (get_user_role(tenant_id) IN ('admin', 'chief_editor', 'editor'));

-- ARTICLES: complex policies based on role
CREATE POLICY "Articles visible to tenant members" ON articles
  FOR SELECT USING (tenant_id IN (SELECT get_user_tenant_ids()));

CREATE POLICY "Contributors can create articles" ON articles
  FOR INSERT WITH CHECK (
    tenant_id IN (SELECT get_user_tenant_ids())
    AND author_id = auth.uid()
  );

CREATE POLICY "Authors can update own draft articles" ON articles
  FOR UPDATE USING (
    author_id = auth.uid() AND status IN ('draft', 'in_review')
  );

CREATE POLICY "Chief editors+ can update any article" ON articles
  FOR UPDATE USING (
    get_user_role(tenant_id) IN ('admin', 'chief_editor')
  );

CREATE POLICY "Super admins can delete articles" ON articles
  FOR DELETE USING (get_user_role(tenant_id) = 'admin');

-- ARTICLE_TAGS
CREATE POLICY "Article tags follow article access" ON article_tags
  FOR SELECT USING (
    article_id IN (SELECT id FROM articles WHERE tenant_id IN (SELECT get_user_tenant_ids()))
  );

CREATE POLICY "Editors+ can manage article tags" ON article_tags
  FOR ALL USING (
    article_id IN (SELECT id FROM articles WHERE tenant_id IN (SELECT get_user_tenant_ids()))
  );

-- ARTICLE_REVISIONS
CREATE POLICY "Revisions visible to tenant members" ON article_revisions
  FOR SELECT USING (
    article_id IN (SELECT id FROM articles WHERE tenant_id IN (SELECT get_user_tenant_ids()))
  );

CREATE POLICY "Revisions created on article save" ON article_revisions
  FOR INSERT WITH CHECK (changed_by = auth.uid());

-- MEDIA
CREATE POLICY "Media visible to tenant members" ON media
  FOR SELECT USING (tenant_id IN (SELECT get_user_tenant_ids()));

CREATE POLICY "Authenticated users can upload media" ON media
  FOR INSERT WITH CHECK (tenant_id IN (SELECT get_user_tenant_ids()) AND uploaded_by = auth.uid());

CREATE POLICY "Admins can delete media" ON media
  FOR DELETE USING (get_user_role(tenant_id) IN ('admin', 'chief_editor'));

-- BANNERS
CREATE POLICY "Banners visible to tenant members" ON banners
  FOR SELECT USING (tenant_id IN (SELECT get_user_tenant_ids()));

CREATE POLICY "Admins and advertisers can manage banners" ON banners
  FOR ALL USING (get_user_role(tenant_id) IN ('admin', 'chief_editor', 'advertiser'));

-- ADVERTISERS
CREATE POLICY "Advertisers visible to tenant members" ON advertisers
  FOR SELECT USING (tenant_id IN (SELECT get_user_tenant_ids()));

CREATE POLICY "Admins can manage advertisers" ON advertisers
  FOR ALL USING (get_user_role(tenant_id) IN ('admin', 'chief_editor', 'advertiser'));

-- EVENTS
CREATE POLICY "Events visible to tenant members" ON events
  FOR SELECT USING (tenant_id IN (SELECT get_user_tenant_ids()));

CREATE POLICY "Editors+ can manage events" ON events
  FOR ALL USING (get_user_role(tenant_id) IN ('admin', 'chief_editor', 'editor'));

-- BREAKING NEWS
CREATE POLICY "Breaking news visible to tenant members" ON breaking_news
  FOR SELECT USING (tenant_id IN (SELECT get_user_tenant_ids()));

CREATE POLICY "Editors+ can manage breaking news" ON breaking_news
  FOR ALL USING (get_user_role(tenant_id) IN ('admin', 'chief_editor', 'editor'));

-- ACTIVITY LOG
CREATE POLICY "Activity log visible to admins" ON activity_log
  FOR SELECT USING (get_user_role(tenant_id) IN ('admin', 'chief_editor'));

CREATE POLICY "System can insert activity log" ON activity_log
  FOR INSERT WITH CHECK (tenant_id IN (SELECT get_user_tenant_ids()));
