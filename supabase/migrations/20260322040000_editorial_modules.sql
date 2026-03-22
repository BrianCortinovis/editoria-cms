BEGIN;

CREATE TABLE IF NOT EXISTS article_comments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  article_id uuid NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES article_comments(id) ON DELETE CASCADE,
  author_name varchar(255) NOT NULL,
  author_email varchar(255) NOT NULL,
  author_url text,
  body text NOT NULL,
  status varchar(32) NOT NULL DEFAULT 'pending',
  source varchar(32) NOT NULL DEFAULT 'website',
  ip_hash varchar(128),
  user_agent text,
  is_imported boolean NOT NULL DEFAULT false,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_article_comments_article_status_created
  ON article_comments(article_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_article_comments_tenant_status
  ON article_comments(tenant_id, status, created_at DESC);

CREATE TABLE IF NOT EXISTS article_authors (
  article_id uuid NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role varchar(64) NOT NULL DEFAULT 'author',
  sort_order int NOT NULL DEFAULT 0,
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (article_id, author_id)
);

CREATE INDEX IF NOT EXISTS idx_article_authors_author
  ON article_authors(author_id, article_id);

INSERT INTO article_authors (article_id, author_id, role, sort_order, is_primary)
SELECT id, author_id, 'author', 0, true
FROM articles
WHERE author_id IS NOT NULL
ON CONFLICT (article_id, author_id) DO NOTHING;

CREATE TABLE IF NOT EXISTS site_forms (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name varchar(255) NOT NULL,
  slug varchar(255) NOT NULL,
  description text,
  fields jsonb NOT NULL DEFAULT '[]'::jsonb,
  recipient_emails jsonb NOT NULL DEFAULT '[]'::jsonb,
  success_message text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT tenant_form_slug_unique UNIQUE (tenant_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_site_forms_tenant_active
  ON site_forms(tenant_id, is_active);

CREATE TABLE IF NOT EXISTS form_submissions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  form_id uuid NOT NULL REFERENCES site_forms(id) ON DELETE CASCADE,
  submitter_name varchar(255),
  submitter_email varchar(255),
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  source_page text,
  ip_hash varchar(128),
  status varchar(32) NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_form_submissions_form_created
  ON form_submissions(form_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_form_submissions_tenant_status
  ON form_submissions(tenant_id, status, created_at DESC);

CREATE TABLE IF NOT EXISTS redirects (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  source_path text NOT NULL,
  target_path text NOT NULL,
  status_code int NOT NULL DEFAULT 301,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT tenant_redirect_source_unique UNIQUE (tenant_id, source_path)
);

CREATE INDEX IF NOT EXISTS idx_redirects_tenant_active
  ON redirects(tenant_id, is_active);

COMMIT;
