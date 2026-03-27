BEGIN;

ALTER TABLE media ENABLE ROW LEVEL SECURITY;
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE advertisers ENABLE ROW LEVEL SECURITY;
ALTER TABLE breaking_news ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Editors can update media metadata" ON media;
CREATE POLICY "Editors can update media metadata" ON media
FOR UPDATE
USING (get_user_role(tenant_id) IN ('admin', 'chief_editor', 'editor'))
WITH CHECK (get_user_role(tenant_id) IN ('admin', 'chief_editor', 'editor'));

DROP POLICY IF EXISTS "Admins and advertisers can manage banners safely" ON banners;
CREATE POLICY "Admins and advertisers can manage banners safely" ON banners
FOR ALL
USING (get_user_role(tenant_id) IN ('admin', 'chief_editor', 'advertiser'))
WITH CHECK (get_user_role(tenant_id) IN ('admin', 'chief_editor', 'advertiser'));

DROP POLICY IF EXISTS "Editors can manage events safely" ON events;
CREATE POLICY "Editors can manage events safely" ON events
FOR ALL
USING (get_user_role(tenant_id) IN ('admin', 'chief_editor', 'editor'))
WITH CHECK (get_user_role(tenant_id) IN ('admin', 'chief_editor', 'editor'));

DROP POLICY IF EXISTS "Members can read advertisers from their tenants" ON advertisers;
CREATE POLICY "Members can read advertisers from their tenants" ON advertisers
FOR SELECT
USING (tenant_id IN (SELECT get_user_tenant_ids()));

DROP POLICY IF EXISTS "Banner managers can manage advertisers safely" ON advertisers;
CREATE POLICY "Banner managers can manage advertisers safely" ON advertisers
FOR ALL
USING (get_user_role(tenant_id) IN ('admin', 'chief_editor', 'advertiser'))
WITH CHECK (get_user_role(tenant_id) IN ('admin', 'chief_editor', 'advertiser'));

DROP POLICY IF EXISTS "Editors can manage breaking news safely" ON breaking_news;
CREATE POLICY "Editors can manage breaking news safely" ON breaking_news
FOR ALL
USING (get_user_role(tenant_id) IN ('admin', 'chief_editor', 'editor'))
WITH CHECK (get_user_role(tenant_id) IN ('admin', 'chief_editor', 'editor'));

DROP POLICY IF EXISTS "Tenant media objects read access" ON storage.objects;
CREATE POLICY "Tenant media objects read access" ON storage.objects
FOR SELECT
USING (
  bucket_id = 'media'
  AND split_part(name, '/', 1) IN (
    SELECT slug FROM tenants WHERE id IN (SELECT get_user_tenant_ids())
  )
);

DROP POLICY IF EXISTS "Tenant media objects insert access" ON storage.objects;
CREATE POLICY "Tenant media objects insert access" ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'media'
  AND split_part(name, '/', 1) IN (
    SELECT slug FROM tenants WHERE id IN (SELECT get_user_tenant_ids())
  )
);

DROP POLICY IF EXISTS "Tenant media objects delete access" ON storage.objects;
CREATE POLICY "Tenant media objects delete access" ON storage.objects
FOR DELETE
USING (
  bucket_id = 'media'
  AND split_part(name, '/', 1) IN (
    SELECT slug FROM tenants WHERE id IN (SELECT get_user_tenant_ids())
  )
  AND (
    SELECT get_user_role(id)
    FROM tenants
    WHERE slug = split_part(name, '/', 1)
    LIMIT 1
  ) IN ('admin', 'chief_editor')
);

DROP POLICY IF EXISTS "Published bucket read only" ON storage.objects;
CREATE POLICY "Published bucket read only" ON storage.objects
FOR SELECT
USING (bucket_id = 'published');

COMMIT;
