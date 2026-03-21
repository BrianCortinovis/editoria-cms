# 🎉 Pagina Demo - Volantino Forme e Sconti

## Descrizione
Pagina di esempio che showcasa tutte le **forme vettoriali straordinarie** con testo di sconto incorporate.

## 📍 Accesso
- **URL Slug**: `volantino-forme-sconti`
- **DB ID**: `page-shapes-demo`
- **Status**: Published
- **Location**: Visibile nella lista delle pagine del sito

## 🎨 Forme Incluse

### 1. **Triangolo** (-30%)
- **Colore**: Arancione (#ff6b35)
- **Clip-path**: `polygon(50% 0%, 0% 100%, 100% 100%)`
- **Effetto**: Ombra arancione
- **Dimensioni**: 180px × 180px

### 2. **Cerchio** (-50%)
- **Colore**: Turchese (#4ecdc4)
- **Clip-path**: `circle(50% at 50% 50%)`
- **Effetto**: Ombra turchese
- **Dimensioni**: 180px × 180px

### 3. **Stella** (-40%)
- **Colore**: Giallo (#f7b731)
- **Clip-path**: `polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)`
- **Effetto**: Ombra gialla
- **Dimensioni**: 180px × 180px

### 4. **Rombo/Diamante** (-25%)
- **Colore**: Viola (#a855f7)
- **Clip-path**: `polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)`
- **Effetto**: Ombra viola grande
- **Dimensioni**: 240px × 240px

### 5. **Freccia/Bomba** (-60%)
- **Colore**: Rosso (#ef4444)
- **Clip-path**: `polygon(0 0, 100% 0, 100% 85%, 50% 100%, 0 85%)`
- **Effetto**: Ombra rossa grande
- **Dimensioni**: 280px × 180px

### 6. **Esagono** (-35%)
- **Colore**: Ciano (#06b6d4)
- **Clip-path**: `polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)`
- **Effetto**: Ombra ciana
- **Dimensioni**: 200px × 200px

## ✨ Caratteristiche

- ✅ **Vector Shapes**: Tutte le forme usano `clip-path` CSS
- ✅ **Ombre Dinamiche**: Ogni forma ha un'ombra colorata corrispondente
- ✅ **Testo Centrato**: Percentuale sconto + nome forma al centro
- ✅ **Responsive**: Flex layout con wrapping
- ✅ **Header**: Titolo con emoji e sottotitolo

## 🔧 Come Usarla nel Editor

1. **Apri il dashboard editor**: `/dashboard/editor`
2. **Carica la pagina**: Seleziona "volantino-forme-sconti" dal menu
3. **Modifica le forme**:
   - Clicca su una sezione per selezionarla
   - Vai al tab **Forma**
   - Cambia la forma o gli effetti
4. **Vedi l'anteprima**: Nella scheda **Anteprima** o visita l'URL pubblico

## 📊 Struttura Blocchi

```
Header (Titolo Volantino)
├── Sezione Trio (Flex Row)
│   ├── Triangolo (-30%)
│   ├── Cerchio (-50%)
│   └── Stella (-40%)
├── Rombo Diamante (-25%)
├── Freccia Bomba (-60%)
└── Esagono Premium (-35%)
```

## 🎯 Casi d'Uso

- **Volantini Online**: Sconto a forma di badge
- **Promo Cards**: Diverse forme per diverse promozioni
- **Showcase**: Dimostra il supporto per vector shapes
- **A/B Testing**: Prova quale forma è più visibile

## 📝 Modifica

Per modificare la pagina:

1. **Via Editor**: Naviga a `/dashboard/editor?page=page-shapes-demo`
2. **Via Database**: Modifica il JSON nella colonna `blocks` della tabella `site_pages`
3. **Via Migration**: Aggiorna il file `supabase/migrations/005_demo_page_shapes.sql`

## 🚀 Deploy

La pagina è pronta per il deploy. Una volta deployata:
- Sarà visibile al pubblico
- Potrà essere modificata dal dashboard
- Supporterà tutte le funzionalità di vector shapes

---

**Creata il**: 2026-03-21
**Ultimo aggiornamento**: 2026-03-21
**Status**: ✅ Pronto per Production
