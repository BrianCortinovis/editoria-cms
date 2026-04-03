-- Scheduled social posts: programmazione oraria multi-piattaforma
-- Un articolo puo' avere N post programmati su piattaforme/target diversi

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type
    WHERE typname = 'scheduled_social_post_status'
  ) THEN
    CREATE TYPE scheduled_social_post_status AS ENUM (
      'pending',    -- in attesa di invio
      'sending',    -- cron lo sta processando
      'sent',       -- inviato con successo
      'failed',     -- invio fallito
      'canceled'    -- annullato dall'utente
    );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS scheduled_social_posts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  article_id    UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  platform      TEXT NOT NULL,           -- 'telegram', 'facebook', 'x', 'linkedin', ...
  target_label  TEXT NOT NULL DEFAULT '', -- es: "Gruppo A", "Pagina principale", "Canale news"
  -- Override credenziali per target specifico (opzionale, altrimenti usa config tenant)
  channel_config JSONB DEFAULT NULL,     -- SocialChannelConfig override per questo target
  -- Contenuto personalizzato (opzionale, altrimenti usa dati articolo)
  custom_text   TEXT DEFAULT NULL,
  -- Programmazione
  scheduled_at  TIMESTAMPTZ NOT NULL,
  status        scheduled_social_post_status NOT NULL DEFAULT 'pending',
  -- Risultato
  posted_at     TIMESTAMPTZ DEFAULT NULL,
  post_id       TEXT DEFAULT NULL,        -- ID del post sulla piattaforma
  error_message TEXT DEFAULT NULL,
  retry_count   INTEGER NOT NULL DEFAULT 0,
  -- Audit
  created_by    UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indici per query cron (post pendenti da inviare)
CREATE INDEX IF NOT EXISTS idx_ssp_pending_scheduled
  ON scheduled_social_posts (scheduled_at)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_ssp_tenant_article
  ON scheduled_social_posts (tenant_id, article_id);

CREATE INDEX IF NOT EXISTS idx_ssp_status
  ON scheduled_social_posts (status);

-- RLS
ALTER TABLE scheduled_social_posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ssp_tenant_select" ON scheduled_social_posts;
CREATE POLICY "ssp_tenant_select"
  ON scheduled_social_posts FOR SELECT
  USING (tenant_id IN (SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "ssp_tenant_insert" ON scheduled_social_posts;
CREATE POLICY "ssp_tenant_insert"
  ON scheduled_social_posts FOR INSERT
  WITH CHECK (tenant_id IN (
    SELECT tenant_id FROM user_tenants
    WHERE user_id = auth.uid() AND role IN ('admin', 'chief_editor', 'editor')
  ));

DROP POLICY IF EXISTS "ssp_tenant_update" ON scheduled_social_posts;
CREATE POLICY "ssp_tenant_update"
  ON scheduled_social_posts FOR UPDATE
  USING (tenant_id IN (
    SELECT tenant_id FROM user_tenants
    WHERE user_id = auth.uid() AND role IN ('admin', 'chief_editor', 'editor')
  ));

DROP POLICY IF EXISTS "ssp_tenant_delete" ON scheduled_social_posts;
CREATE POLICY "ssp_tenant_delete"
  ON scheduled_social_posts FOR DELETE
  USING (tenant_id IN (
    SELECT tenant_id FROM user_tenants
    WHERE user_id = auth.uid() AND role IN ('admin', 'chief_editor')
  ));
