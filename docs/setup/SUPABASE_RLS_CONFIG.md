# Supabase RLS Policies Configuration

**Date:** March 21, 2026
**Status:** RLS policies need to be audited and configured via Supabase Console

---

## Overview

Row-Level Security (RLS) policies ensure multi-tenant data isolation at the database level. All policies should be configured in Supabase Console under **Authentication → Policies**.

---

## Required RLS Policies

### 1. `user_tenants` Table
**Purpose:** Prevent users from seeing other users' tenant associations

```sql
-- Policy: Users can read their own tenant associations
CREATE POLICY "Users can read own tenant associations" ON user_tenants
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Admins can manage tenant associations
CREATE POLICY "Admins can manage tenant associations" ON user_tenants
FOR ALL
USING (
  auth.uid() IN (
    SELECT user_id FROM user_tenants
    WHERE tenant_id IN (
      SELECT id FROM tenants WHERE owner_id = auth.uid()
    )
  )
);
```

### 2. `site_pages` Table
**Purpose:** Users can only access pages from their tenants

```sql
-- Policy: Users can read pages from their tenants
CREATE POLICY "Users can read pages from their tenants" ON site_pages
FOR SELECT
USING (
  tenant_id IN (
    SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
  )
);

-- Policy: Users can write pages to their tenants
CREATE POLICY "Users can write pages to their tenants" ON site_pages
FOR INSERT
WITH CHECK (
  tenant_id IN (
    SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
  )
);

-- Policy: Users can update pages in their tenants
CREATE POLICY "Users can update pages in their tenants" ON site_pages
FOR UPDATE
USING (
  tenant_id IN (
    SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  tenant_id IN (
    SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
  )
);

-- Policy: Users can delete pages in their tenants
CREATE POLICY "Users can delete pages in their tenants" ON site_pages
FOR DELETE
USING (
  tenant_id IN (
    SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
  )
);
```

### 3. `blocks` Table
**Purpose:** Users can only access blocks in pages they own

```sql
-- Policy: Users can read blocks from their pages
CREATE POLICY "Users can read blocks from their pages" ON blocks
FOR SELECT
USING (
  page_id IN (
    SELECT id FROM site_pages
    WHERE tenant_id IN (
      SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
    )
  )
);

-- Policy: Users can write blocks to their pages
CREATE POLICY "Users can write blocks to their pages" ON blocks
FOR INSERT
WITH CHECK (
  page_id IN (
    SELECT id FROM site_pages
    WHERE tenant_id IN (
      SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
    )
  )
);

-- Policy: Users can update blocks in their pages
CREATE POLICY "Users can update blocks in their pages" ON blocks
FOR UPDATE
USING (
  page_id IN (
    SELECT id FROM site_pages
    WHERE tenant_id IN (
      SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
    )
  )
)
WITH CHECK (
  page_id IN (
    SELECT id FROM site_pages
    WHERE tenant_id IN (
      SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
    )
  )
);

-- Policy: Users can delete blocks in their pages
CREATE POLICY "Users can delete blocks in their pages" ON blocks
FOR DELETE
USING (
  page_id IN (
    SELECT id FROM site_pages
    WHERE tenant_id IN (
      SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
    )
  )
);
```

### 4. `articles` Table
**Purpose:** Users can only access articles from their tenants

```sql
-- Policy: Users can read articles from their tenants
CREATE POLICY "Users can read articles from their tenants" ON articles
FOR SELECT
USING (
  tenant_id IN (
    SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
  )
);

-- Policy: Users can write articles to their tenants
CREATE POLICY "Users can write articles to their tenants" ON articles
FOR INSERT
WITH CHECK (
  tenant_id IN (
    SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
  )
);

-- Policy: Users can update articles in their tenants
CREATE POLICY "Users can update articles in their tenants" ON articles
FOR UPDATE
USING (
  tenant_id IN (
    SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  tenant_id IN (
    SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
  )
);

-- Policy: Users can delete articles in their tenants
CREATE POLICY "Users can delete articles in their tenants" ON articles
FOR DELETE
USING (
  tenant_id IN (
    SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
  )
);
```

### 5. `content_slots` Table
**Purpose:** Users can only access content slots from their pages

```sql
-- Policy: Users can read content slots from their pages
CREATE POLICY "Users can read content slots from their pages" ON content_slots
FOR SELECT
USING (
  page_id IN (
    SELECT id FROM site_pages
    WHERE tenant_id IN (
      SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
    )
  )
);

-- Similar INSERT, UPDATE, DELETE policies as blocks...
```

### 6. `seo_analysis_history` Table
**Purpose:** Users can only see SEO analysis for their tenants

```sql
-- Policy: Users can read SEO analysis from their tenants
CREATE POLICY "Users can read SEO analysis from their tenants" ON seo_analysis_history
FOR SELECT
USING (
  tenant_id IN (
    SELECT tenant_id FROM user_tenants WHERE user_id = auth.uid()
  )
);
```

---

## How to Enable RLS

1. Go to **Supabase Console** → Select your project
2. Click **Authentication** in the left sidebar
3. Click **Policies** tab
4. For each table listed above:
   - Click the table name
   - Click **New Policy** → **For specific operations**
   - Paste the SQL from above
   - Click **Review** and **Save policy**

**Alternative:** Run SQL directly in **SQL Editor**:
```
-- Paste all SQL from above sections
```

---

## Testing RLS

After enabling RLS, test with:

```typescript
// Test 1: User from Tenant A should NOT see pages from Tenant B
const userA = await supabase.auth.getUser(); // User in Tenant A
const pages = await supabase
  .from('site_pages')
  .select('*')
  .eq('tenant_id', 'tenant-b-id');
// Should return empty or 403 Forbidden

// Test 2: User from Tenant A CAN see their own pages
const pagesOwn = await supabase
  .from('site_pages')
  .select('*')
  .eq('tenant_id', 'tenant-a-id');
// Should return pages
```

---

## Security Headers (Additional Configuration)

In **Supabase Console** → **Project Settings** → **Network**:

- ✅ Enable **Enforce HTTPS** (should be default)
- ✅ Add **Custom Headers** if needed for CORS

---

## Environment Variables

Already configured in `.env.local`:
- `CRON_SECRET=editoria-cron-secure-a3f7e9b2d5c8f1a4` ✅

---

## Next Steps

1. **Immediate:** Enable RLS policies in Supabase Console (5-10 min per table)
2. **Before Production:** Run security tests to verify isolation
3. **At End of Development:** Rotate API keys (when you decide)

---

**Note:** API key rotation is intentionally deferred until end of development to avoid service interruptions. All keys are protected in `.env.local` and never committed to git.

For questions or additional policies needed, see `/SECURITY_AUDIT.md`.
