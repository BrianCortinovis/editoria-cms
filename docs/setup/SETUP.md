# Editoria CMS - Setup Enterprise Guide

## 🚀 Sistema Completo 3-in-1

**Editoria CMS** è un **CMS editoriale professionale** con:
- ✅ **Editor grafico integrato** (site-builder nel dashboard)
- ✅ **Admin panel WordPress-style** con tab per articoli, categorie, media, etc
- ✅ **API REST v1** pubblica per frontend
- ✅ **Multi-tenant** - supporta multiple testate
- ✅ **Database Supabase** con RLS policies
- ✅ **Activity logging** e content versioning

## 📦 Struttura Progetto

```
editoria-cms/                 # Admin CMS + Editor
├── src/
│   ├── app/dashboard/
│   │   ├── editor/           # 🎨 TAB EDITOR GRAFICO
│   │   ├── articoli/         # 📝 Gestione articoli
│   │   ├── categorie/        # 📁 Categorie
│   │   ├── banner/           # 📢 Banner pubblicitari
│   │   ├── layout/           # 🎯 Layout sito
│   │   └── ...
│   ├── app/api/v1/          # 🔌 REST API
│   ├── lib/blocks/          # 35+ block types
│   ├── lib/stores/          # Zustand state management
│   └── components/          # React components

valbremmbana-web/            # Frontend pubblico
├── src/
│   ├── app/                 # Pages (Next.js App Router)
│   ├── lib/api.ts           # Client API
│   └── lib/block-renderer.tsx # Render layouts
```

## 🔧 Setup Locale

### 1. Installare dipendenze

```bash
cd editoria-cms
npm install
```

### 2. Environment variables

Copia `.env.example` in `.env.local`:

```bash
cp .env.example .env.local
```

Personalizza i valori:
```
NEXT_PUBLIC_SUPABASE_URL=https://xtyoeajjxgeeemwlcotk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_TENANT_SLUG=valbremmbana
NEXT_PUBLIC_TENANT_ID=125172d3-f498-439f-a045-61e409dac706
```

### 3. Eseguire migrations Supabase

```bash
npm run supabase:migrate
```

### 4. Avviare dev server

```bash
npm run dev
```

Accedi a: `http://localhost:3001`

## 🎨 Editor Grafico

Visita `/dashboard/editor` per accedere all'**editor visuale integrato**.

**Funzioni:**
- Drag-and-drop canvas
- 35+ block types (Hero, Text, Gallery, Tabs, Accordion, Video, etc)
- Style editor in tempo reale
- Layer tree per navigare elementi
- Undo/Redo con Zundo
- Rich text editing con TipTap
- Layout presets

## 📊 Database Schema

### Tabelle principali:

- **tenants** - Multi-tenant architecture
- **profiles** - Users & permissions
- **articles** - Content articles
- **categories** - Article categories
- **tags** - Article tags
- **pages** - Visual pages (with layout_data JSONB)
- **page_versions** - Version history & publishing
- **banners** - Ad banners
- **breaking_news** - News alerts
- **events** - Event management
- **media** - File uploads
- **activity_log** - Audit trail

### Security Features:

- ✅ Row Level Security (RLS) policies
- ✅ Multi-tenant isolation
- ✅ Activity logging
- ✅ Version control for pages
- ✅ Author tracking

## 🔌 REST API v1

### Base URL:
```
http://localhost:3001/api/v1
```

### Endpoints:

**GET /articles**
```bash
curl "http://localhost:3001/api/v1/articles?tenant=valbremmbana&limit=20"
```

Response:
```json
{
  "articles": [...],
  "total": 42
}
```

**GET /pages**
```bash
curl "http://localhost:3001/api/v1/pages?tenant=valbremmbana"
```

**POST /pages** (Create/Update)
```bash
curl -X POST http://localhost:3001/api/v1/pages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer token" \
  -d '{
    "title": "Homepage",
    "slug": "home",
    "layout_data": {"blocks": [...]},
    "status": "published",
    "tenant_id": "..."
  }'
```

**GET /health**
```bash
curl http://localhost:3001/api/v1/health
```

## 🌐 Frontend Valbremmbana Web

Consuma l'API di editoria-cms:

```bash
cd valbremmbana-web
npm install
npm run dev
```

Accedi a: `http://localhost:3000`

### Features:
- ✅ Homepage con articoli in griglia
- ✅ Pagine articolo dinamiche (`/articoli/[slug]`)
- ✅ Rendering dinamico dei layout dal site-builder
- ✅ Metadata SEO
- ✅ Responsive design

## 📱 Tab Editor - UX

Nel CMS dashboard (`/dashboard/editor`):

1. **Canvas centrale** - Visualizza e edita il layout
2. **Left panel** - BlockLibrary (blocchi disponibili)
3. **Right panel** - StyleEditor (colori, spacing, font)
4. **Layer Tree** - Navigazione elemento
5. **Toolbar** - Undo/Redo, Preview, Export

**Click-to-Edit:**
- Clicca su un blocco nel canvas
- Panel di destra mostra le opzioni di stile
- Modifica e salva in tempo reale

## 🔐 Authentication

L'app usa **Supabase Auth**:
- Sign up / Login / Logout
- Profile management
- Tenant assignment
- Role-based access (admin, editor, viewer)

## 📊 Activity Log

Tutte le azioni sono tracciati:
- Creazione/modifica/pubblicazione articoli
- Editor usage
- User login/logout
- Content changes

Visita `/dashboard/activity-log` per il report.

## 🚀 Deploy su Vercel

### Setup Secrets GitHub

```bash
# Esegui una volta per configurare i secrets
bash setup-secrets.sh
```

### Deploy

1. Push su GitHub
2. Vercel auto-deploya su ogni push a `main`
3. Environment variables auto-sincronizzati

## 🎯 Workflow Editoriale

### Articolo:
1. Admin crea articolo in `/dashboard/articoli`
2. Redattore edita testo, aggiungi immagine
3. Pubblica (status = published)
4. API fetch automaticamente l'articolo
5. Frontend mostra in homepage e pagina dettaglio

### Layout:
1. Designer apre `/dashboard/editor`
2. Drag-and-drop blocchi (Hero, Text, Gallery, etc)
3. Customizza stile in real-time
4. Salva layout
5. Associa layout a pagina o articolo
6. Frontend renderizza il layout dinamicamente

## 📈 Performance

- ✅ API caching (60s per articles, 300s per pages)
- ✅ Database indexes su query frequenti
- ✅ Supabase RLS optimize queries
- ✅ Image optimization (Vercel Image Optimization)
- ✅ Code splitting (Next.js)

## 🔄 Webhook System (Future)

Implementare webhook per:
- Notificare frontend quando pubblicato articolo
- Invalidate cache su Vercel
- Send notifications
- Slack/Email alerts

## 📞 Support

Per domande o issues:
- GitHub Issues
- Documentation in `docs/`

---

**Status:** ✅ Production Ready (v1.0)
**Last Updated:** 2026-03-21
