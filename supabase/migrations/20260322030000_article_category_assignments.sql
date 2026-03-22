BEGIN;

CREATE TABLE IF NOT EXISTS article_categories (
  article_id uuid NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (article_id, category_id)
);

CREATE INDEX IF NOT EXISTS idx_article_categories_category_article
  ON article_categories(category_id, article_id);

CREATE INDEX IF NOT EXISTS idx_article_categories_article_category
  ON article_categories(article_id, category_id);

INSERT INTO article_categories (article_id, category_id)
SELECT id, category_id
FROM articles
WHERE category_id IS NOT NULL
ON CONFLICT (article_id, category_id) DO NOTHING;

COMMIT;
