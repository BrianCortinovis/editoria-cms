# 🚀 Valbrembana Web - Fresh Start

**Status**: ✅ Database Reset & Ready for Design
**Date**: 2026-03-21
**Commit**: d6b2a54

## What's Been Done

✅ **Cancellato tutto il vecchio sito**:
- Layout templates: 0 rows
- Layout slots: 0 rows
- Site pages: 0 rows
- ✅ Account utenti: Mantenuti intatti

**Database**: Completamente vuoto e pronto per Valbrembana Web

## Come Iniziare

### Step 1: Avvia il dev server
```bash
npm run dev
```
Accedi a `http://localhost:3000/dashboard/editor`

### Step 2: Disegna il layout
Nel builder:
1. Crea i **layout template** (homepage, article, ecc.)
2. Configura gli **slot** per le sezioni
3. Crea le **pagine** per Valbrembana Web

### Step 3: Aggiungi contenuti
- Articoli tramite `/dashboard/articoli`
- Configurazioni tramite `/dashboard/settings`
- Banner e promo nel dashboard

## Tools Disponibili per il Design

### 🎨 Forme Vettoriali (Vector Shapes)
- Polygon shapes (triangoli, stelle, esagoni)
- Circle e ellipse
- **Free Transform Editor** per modificare con precisione
  - Clicca ⤢ nel toolbar per attivare
  - Trascina i punti blu per reshapare
  - Trascina il punto rosso per riposizionare

Vedi: [FREE_TRANSFORM_GUIDE.md](FREE_TRANSFORM_GUIDE.md)

### 📐 Toolbar Positioning
- 6 posizioni fixed (angoli + centri)
- **Center-center** per positioning libero
- Toolbar draggabile sui bordi della sezione

### ✨ Shape Editor
Tab "Forma" nel pannello destro:
- Seleziona shape preset (polygon, circle, ellipse)
- Applica clip-path CSS
- Real-time preview

### 🎭 Effetti & Stili
- Ombre personalizzate
- Gradienti CSS
- Filter effects (blur, brightness, ecc.)
- Mix-blend-mode
- Backdrop filter (glassmorphism)

## Gestione Slot (3 Modalità)

### A - Automatica (Auto)
- Slot si riempie con ultimi articoli della categoria
- Configurato nel layout editor
- Perfetto per news feeds

### B - Manuale (Manual)
- Dall'editor articolo scegli lo slot specifico
- Articoli assegnati manualmente
- Vedi: [ArticleEditor.tsx](src/components/editor/ArticleEditor.tsx)

### C - Drag & Drop (Mixed)
- Pannello visuale con drag & drop
- Articoli pinnati + auto-fill
- Tab "Assegna" nel layout editor

## File di Riferimento

| File | Descrizione |
|------|-------------|
| `src/components/builder/CanvasBlock.tsx` | Main block editor con shapes e toolbar |
| `src/components/builder/FreeTransformOverlay.tsx` | Free transform per forme vettoriali |
| `src/components/shapes/ClipPathEditor.tsx` | Editor clip-path nel pannello destro |
| `src/app/dashboard/layout/page.tsx` | Layout editor (zone, moduli) |
| `src/app/dashboard/editor/page.tsx` | Page builder |

## Database Schema

### Core Tables
- `site_pages` - Pagine pubbliche (JSON blocks)
- `layout_templates` - Wireframe layout (grid/flex)
- `layout_slots` - Sezioni per articoli/contenuto
- `slot_assignments` - Assegnazioni manuali articoli→slot
- `articles` - Articoli con categorizzazione
- `profiles` - Account utenti

### RLS Policies
Tutte le tabelle hanno RLS per tenant isolation.

## Next Steps

1. **Design Homepage**
   - Crea template "home"
   - Aggiungi hero section
   - Configura news slots

2. **Design Article Page**
   - Template "article"
   - Sidebar con categorie
   - Related articles

3. **Popola Contenuti**
   - Articoli via API/dashboard
   - Immagini e media
   - Metadata SEO

4. **Deploy**
   - Verifica tutto in staging
   - Deploy a produzione
   - Setup domain Valbrembana

## Reset Command (Se Serve Ricominciare)

```bash
node scripts/reset-valbrembana.js
```

Cancella ancora:
- Layout templates
- Layout slots
- Site pages
- Ma mantiene account utenti

## Debug & Troubleshooting

### Shapes non render?
- Verifica che il blocco abbia `shape.type === 'clip-path'`
- Controlla il valore del clip-path nel JSON
- Vedi [SHAPES_DEMO_PAGE.md](SHAPES_DEMO_PAGE.md) per esempi

### Toolbar non visible?
- Block deve essere selezionato
- Hover sul blocco per mostrare toolbar
- Controlla `selected` state in CanvasBlock

### Slot assignment non funziona?
- Verifica RLS policies in Supabase
- Check `slot_assignments` table
- Vedi API route: `/api/v1/articles/[id]/slot-assignment`

## Deploy Checklist

- [ ] Design homepage completo
- [ ] Layout template creati
- [ ] Almeno 5 articoli di test
- [ ] Images e media ottimizzate
- [ ] SEO metadata compilato
- [ ] Test su staging
- [ ] Deploy a produzione
- [ ] Domain pointing
- [ ] SSL certificate
- [ ] Analytics setup
- [ ] Backup configurato

---

**Pronto a creare un bellissimo sito Valbrembana Web! 🎨**
