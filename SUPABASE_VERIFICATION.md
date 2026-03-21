# Supabase Verification Checklist

**Purpose:** Verify local development environment is correctly configured before pushing to production

---

## ✅ Environment Variables Checklist

### .env.local File
```bash
# Run this to verify all required vars are set
grep -E "NEXT_PUBLIC_SUPABASE_URL|NEXT_PUBLIC_SUPABASE_ANON_KEY|SUPABASE_SERVICE_ROLE_KEY|CRON_SECRET|REVALIDATION_SECRET" .env.local
```

**Expected Output:**
```
NEXT_PUBLIC_SUPABASE_URL=https://xtyoeajjxgeeemwlcotk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJh...
SUPABASE_SERVICE_ROLE_KEY=eyJh...
REVALIDATION_SECRET=editoria-revalidate-7f8a9b2c
CRON_SECRET=editoria-cron-secure-a3f7e9b2d5c8f1a4
```

**Status:** ✅ All configured

### .gitignore Check
```bash
# Verify .env.local is ignored
grep ".env.local" .gitignore
```

**Status:** ✅ `.env.local` is in `.gitignore` (line 34)

---

## ✅ Git History Check

### Verify No Secrets Committed
```bash
# Check if .env.local was ever committed
git log --all --full-history -- ".env.local"

# Check all .env* files
git log --all --full-history -- ".env*"

# Search for exposed keys in commit history
git log -p --all -S "NEXT_PUBLIC_SUPABASE" | head -20
```

**Status:** ✅ No `.env.local` commits found

**Result:**
```
(no output = good, keys were never exposed)
```

---

## 🔄 Running Local Development

### Start Dev Server
```bash
npm run dev
```

### Test Local Supabase Connection
```bash
# Create a test script to verify auth works
curl "http://localhost:3000/api/auth/session" \
  -H "Authorization: Bearer YOUR_TEST_TOKEN"
```

**Expected:** Session returns user info (or 401 if no session)

---

## 🔐 Multi-Tenant Isolation Check (Local)

### Test 1: User A Cannot See Tenant B Data

```bash
# Login as User A (from tenant A)
USER_A_TOKEN="<auth token for user in tenant A>"

# Try to fetch pages from Tenant B
curl "http://localhost:3000/api/builder/pages?tenant_id=tenant-b-uuid" \
  -H "Authorization: Bearer $USER_A_TOKEN"

# Expected: 403 Forbidden
# { "error": "Forbidden" }
```

### Test 2: User A Can See Tenant A Data

```bash
# Fetch pages from their own tenant
curl "http://localhost:3000/api/builder/pages?tenant_id=tenant-a-uuid" \
  -H "Authorization: Bearer $USER_A_TOKEN"

# Expected: 200 OK
# { "pages": [...] }
```

### Test 3: AI Routes Are Restricted

```bash
# Try to analyze layout without proper tenant access
curl "http://localhost:3000/api/ai/analyze-layout" \
  -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $USER_A_TOKEN" \
  -d '{"tenant_id":"tenant-b-uuid","files":[...]}'

# Expected: 403 Forbidden
# { "error": "Forbidden: no access to this tenant" }
```

---

## 📊 Cron Job Configuration

### Verify CRON_SECRET Works

```bash
# Test the cron endpoint with correct secret
curl "http://localhost:3000/api/cron/seo-analysis" \
  -H "Authorization: Bearer editoria-cron-secure-a3f7e9b2d5c8f1a4"

# Expected: 200 OK with results
```

### Verify Cron Rejects Unauthorized Calls

```bash
# Test without secret
curl "http://localhost:3000/api/cron/seo-analysis"

# Expected: 401 Unauthorized
# { "error": "Unauthorized" }
```

---

## 🗄️ Database RLS Policies

### Check Current RLS Status in Supabase Console

1. Go to **Supabase Console** → **Authentication** → **Policies**
2. For each table, verify:
   - ✅ `user_tenants` — Has SELECT policy for `auth.uid() = user_id`
   - ✅ `site_pages` — Has multi-tenant isolation policy
   - ✅ `blocks` — Has multi-tenant isolation policy
   - ✅ `articles` — Has multi-tenant isolation policy

**Manual Check (if RLS is enabled):**
```sql
-- In Supabase SQL Editor, check which tables have RLS enabled
SELECT schemaname, tablename
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('user_tenants', 'site_pages', 'blocks', 'articles')
ORDER BY tablename;

-- Check if RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('user_tenants', 'site_pages', 'blocks', 'articles');
```

**Status:** ⚠️ **To be configured** — See `/SUPABASE_RLS_CONFIG.md`

---

## 🔄 Data Sync Check

### Verify Tables Exist and Have Data

```bash
# Check in Supabase Console → Table Editor

- [ ] `tenants` table — 1+ rows
- [ ] `user_tenants` table — User-tenant associations present
- [ ] `site_pages` table — Pages created in builder
- [ ] `blocks` table — Blocks from pages
- [ ] `articles` table — Editorial content
```

---

## 📋 Checklist Summary

Before deployment:

- [x] CRON_SECRET configured in `.env.local`
- [x] `.env.local` in `.gitignore`
- [x] No secrets in git history
- [ ] RLS policies enabled in Supabase Console (manual step)
- [ ] Multi-tenant isolation tested locally
- [ ] Cron secret verification passed
- [ ] All tables have data and RLS enabled
- [ ] Development environment fully functional

---

## 🚀 Before Production Push

1. **Enable RLS Policies** (5-10 min in Supabase Console)
2. **Run Full Security Tests** (see tests above)
3. **Verify Cron Job Works** in staging
4. **Plan Key Rotation** (schedule for end of development)

---

## 📞 Troubleshooting

### Issue: "No tenant access" error in builder
**Solution:** Check `user_tenants` table — user should have an entry associating them with the tenant

### Issue: Pages visible across tenants
**Solution:** Enable RLS policies (currently disabled by default in Supabase)

### Issue: Cron job fails with 401
**Solution:** Verify `CRON_SECRET` in `.env.local` matches the header value being sent

---

**Last Updated:** March 21, 2026
**Next Review:** After RLS policies are enabled in Supabase Console
