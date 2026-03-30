# 🧪 Test Checklist - Verifica Componenti

## Come usare questa checklist:
1. Apri il CMS editor
2. Per ogni test, esegui l'azione e verifica il risultato
3. Marca come ✅ se funziona, ❌ se non funziona

---

## 🎮 KEYBOARD SHORTCUTS TEST

### Save & Shortcuts
- [ ] **Ctrl+S** (o Cmd+S su Mac) → Salva la pagina (vedi toast "Salvato")
- [ ] **Delete** → Seleziona un blocco, premi Delete → Blocco eliminato
- [ ] **Backspace** → Stessa cosa del Delete
- [ ] **Ctrl+D** → Seleziona un blocco, premi Ctrl+D → Blocco duplicato
- [ ] **Ctrl+C** → Seleziona un blocco, premi Ctrl+C → Copia in clipboard
- [ ] **Ctrl+V** → Dopo aver copiato, premi Ctrl+V → Nuovo blocco incollato
- [ ] **Ctrl+X** → Seleziona un blocco, premi Ctrl+X → Blocco copiato E eliminato
- [ ] **Ctrl+Z** → Fai un'azione, premi Ctrl+Z → Azione annullata
- [ ] **Ctrl+Y** → Dopo undo, premi Ctrl+Y → Azione rifatta
- [ ] **Ctrl+Shift+Z** → Stessa cosa di Ctrl+Y
- [ ] **Ctrl+A** → Premi Ctrl+A → Tutti i blocchi selezionati
- [ ] **Arrow Keys** → Seleziona un blocco, freccia su → Si sposta di 1px
- [ ] **Shift + Arrow** → Seleziona un blocco, Shift+Freccia → Si sposta di 10px

---

## 🎨 EFFETTI CSS TEST

### Glassmorphism Effects
- [ ] **Right Panel** → Sezione "Glassmorphism" presente
- [ ] **Enable checkbox** → Abilita glassmorphism
- [ ] **Blur slider** → Muovi slider → Blur cambia 0-30px
- [ ] **Saturation slider** → Muovi slider → Saturazione cambia 50-150%
- [ ] **Opacity slider** → Muovi slider → Opacità background cambia
- [ ] **Color picker** → Cambia colore → Background color cambia
- [ ] **Preset buttons** → Clicca "Vetro Chiaro" → Valori cambiano
- [ ] **Preset buttons** → Clicca "Vetro Scuro" → Valori cambiano
- [ ] **Preset buttons** → Clicca "Vetro Colorato" → Valori cambiano

### CSS Filters Section
- [ ] **Right Panel** → Sezione "Filtri CSS" presente (collapsed)
- [ ] **Click to expand** → Clicca sulla sezione → Si espande
- [ ] **Blur slider** → Muovi 0-20px → Blur applicato al blocco
- [ ] **Brightness slider** → Muovi 50-150% → Luminosità cambia
- [ ] **Contrast slider** → Muovi 50-150% → Contrasto cambia
- [ ] **Saturation slider** → Muovi 0-200% → Saturazione cambia
- [ ] **Hue rotate slider** → Muovi 0-360° → Tonalità cambia colori
- [ ] **Opacity slider** → Muovi 0-100% → Opacità blocco cambia
- [ ] **Drop shadow slider** → Muovi 0-20px → Ombra applicata
- [ ] **Reset button** → Clicca "Ripristina" → Tutti i filtri a 0

---

## 📦 BLOCCHI TEST

### Layout Blocks
- [ ] **Section block** → Toolbar: click "Sez" → Sezione aggiunta
- [ ] **Columns block** → Toolbar: click "Col" → Colonne aggiunte (3 per default)
- [ ] **Container block** → Deve essere tra i blocchi disponibili

### Content Blocks
- [ ] **Text block** → Toolbar: click "Txt" → Testo aggiunto, editabile
- [ ] **Hero block** → Toolbar: click "Hero" → Hero section aggiunto
- [ ] **Image gallery** → Toolbar: click "Img" → Galleria aggiunta
- [ ] **Video block** → Toolbar: click "Vid" → Video block aggiunto
- [ ] **Divider** → Toolbar: click "Div" → Divisore aggiunto (con forme custom)

### Editorial Blocks
- [ ] **Breaking Ticker** → Toolbar: cerca "Ticker" → Barra ticker con scorrimento
- [ ] **Article Grid** → Deve essere renderizzabile
- [ ] **Newsletter** → Toolbar: click "NL" → Newsletter block

### Interactive Blocks
- [ ] **Carousel** → Toolbar: deve essere disponibile
- [ ] **Accordion** → Toolbar: deve essere disponibile
- [ ] **Tabs** → Toolbar: deve essere disponibile
- [ ] **Slideshow** → Toolbar: click "Sld" → Slideshow aggiunto

### Advertising Blocks
- [ ] **Banner ADV** → Toolbar: click "ADV" → Banner standard aggiunto
- [ ] **Banner Dynamic** → Toolbar: click "BDyn" → Banner con animazioni aggiunto
  - [ ] Autoplay funziona
  - [ ] Frecce navigazione presenti
  - [ ] Puntini navigazione presenti
  - [ ] Transizioni fluide

---

## 🎬 ANIMAZIONI TEST

### Ticker Animations
- [ ] **Breaking Ticker** → Blocco aggiunto → Testo scorre da destra a sinistra
- [ ] **Velocità** → Slider velocità 0-100 → Velocità scorrimento cambia
- [ ] **Direzione** → Scorre continuamente senza interruzioni

### Banner Dynamic
- [ ] **Banner Dynamic** → Blocco aggiunto → Banner appare
- [ ] **Autoplay** → Banner cambia automaticamente ogni 5 secondi
- [ ] **Frecce** → Clicca freccia destra → Slide successivo con transizione
- [ ] **Frecce** → Clicca freccia sinistra → Slide precedente con transizione
- [ ] **Puntini** → Clicca puntino → Vai a quel slide
- [ ] **Transizioni** → Cambio slide con fade/slide smooth
- [ ] **Overlay** → Contenuto visible con overlay scuro

### General Animations
- [ ] **Hover effects** → Button/Link → Hover state con cambio colore/scale
- [ ] **Drag & Drop** → Trascina blocco da Library → Smooth animation
- [ ] **Resize** → Prendi handle su un blocco → Ridimensiona con anteprima
- [ ] **Select feedback** → Seleziona blocco → Bordo e handles visibili

---

## 🖼️ UI TEST

### Right Panel
- [ ] **Right Panel** → Sidebar destra visibile
- [ ] **Tab: Style** → Mostra layout, bg, typography, border, shadow
- [ ] **Tab: Effects** → Mostra glassmorphism, CSS filters
- [ ] **Tab: Advanced** → Mostra strumenti avanzati
- [ ] **Color Picker** → Click su input colore → Picker appare

### Left Panel
- [ ] **Left Panel** → Sidebar sinistra visibile
- [ ] **Tab: Blocks** → Mostra libreria blocchi con categorie
- [ ] **Tab: Layers** → Mostra albero gerarchico blocchi
- [ ] **Block selection** → Clicca blocco in Layers → Blocco selezionato in canvas

### Main Toolbar
- [ ] **Save button** → Presente e funzionante
- [ ] **Undo/Redo buttons** → Presenti e funzionanti
- [ ] **Device icons** → Desktop, Tablet, Mobile switcher
- [ ] **Zoom controls** → Zoom in/out + reset zoom
- [ ] **Preview button** → Entra in preview mode
- [ ] **Export button** → Presente

### Block Tools
- [ ] **Block selection** → Seleziona un blocco
- [ ] **Toolbar appears** → Toolbar blu appare sopra/intorno al blocco
- [ ] **Grab icon** → Icona mano per trascinare
- [ ] **Block label** → Nome del blocco visible
- [ ] **Duplica button** → Quando selezionato, appare in main toolbar
- [ ] **Elimina button** → Quando selezionato, appare in main toolbar

---

## 🚀 PERFORMANCE TEST

- [ ] **Page load** → Carica senza ritardi evidenti
- [ ] **Interaction latency** → Clic bottone → Risposta immediata (<200ms)
- [ ] **Drag smoothness** → Trascina blocco → Movimento fluido 60fps
- [ ] **No console errors** → Apri console (F12) → Nessun errore rosso

---

## 📱 RESPONSIVENESS TEST

- [ ] **Desktop view** → Canvas ben visibile e spacioso
- [ ] **Tablet preview** → Device icon tablet → Layout adatta
- [ ] **Mobile preview** → Device icon mobile → Layout adatta
- [ ] **Sidebar collapse** → Resize viewport → Sidebar responsiva
- [ ] **Toolbar responsive** → Resize viewport → Toolbar si adatta

---

## 🔄 STATE MANAGEMENT TEST

- [ ] **Undo/Redo history** → Usa Ctrl+Z e Ctrl+Y → History funziona
- [ ] **Autosave** → Aspetta 5 secondi → Salvataggio automatico
- [ ] **Block selection sync** → Seleziona in canvas → Layers aggiorna
- [ ] **Blocks sync** → Modifica in RightPanel → Canvas aggiorna

---

## 📊 FINAL VERDICT

Dopo aver completato i test:

**Se ✅ 90%+:** Sistema pronto per produzione
**Se ✅ 70-89%:** Sistema funzionante con issues minori
**Se ✅ <70%:** Problemi significativi, debug necessario

---

**Data Test:** _______________
**Tester:** _______________
**Note:** _______________________________________________

---

*Ultimo aggiornamento: 26 Marzo 2026*
