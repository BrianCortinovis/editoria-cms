# 🎨 Free Transform Editor - Guida Completa

## Cos'è?
Un editor inline per modificare con precisione le forme vettoriali (clip-path) direttamente nel builder. Permette di:
- ✅ **Trascinare i vertici** di un poligono per cambiar forma
- ✅ **Spostare il centro** della forma (offset di tutti i punti)
- ✅ **Modificare circle e ellipse** trascinando i raggi
- ✅ **Real-time preview** mentre modifichi

## Come attivarlo

### 1. Nel Builder
1. Accedi a `/dashboard/editor`
2. Seleziona un blocco che ha una forma vettoriale (clip-path)
3. Nel toolbar azzurro, cerca l'icona con le **frecce diagonali** (⤢)
4. Clicca il bottone per attivare la trasformazione libera

### 2. Cosa vedi
- La sezione si colora di **blu con bordo blu** (zona interattiva)
- Compaiono dei **punti blu** ai vertici della forma
- Compare un **punto rosso** al centro della forma
- Un'indicazione in basso: "Trascina i punti o il centro | Click qui per chiudere"

## Come usarlo

### Per i poligoni (triangolo, stella, esagono, ecc.)
1. **Trascinare un vertice**: Clicca e trascina un punto blu per muovere quel vertice
   - Il clip-path si aggiorna in tempo reale
   - Puoi posizionare il vertice ovunque dentro la sezione (0-100%)

2. **Spostare il centro**: Clicca il punto rosso e trascinalo
   - Tutti i vertici si muovono insieme (offset proporzionale)
   - La forma mantiene la sua forma relativa

### Per i cerchi (circle)
1. I 4 punti blu rappresentano i raggi (Top, Bottom, Left, Right)
2. **Trascinare un raggio**: Modifica il raggio del cerchio
3. **Spostare il centro**: Modifica la posizione del cerchio

### Per le ellissi (ellipse)
1. I 4 punti blu rappresentano gli assi (Top, Bottom, Left, Right)
2. **Trascinare orizzontalmente**: Modifica l'asse X (rx)
3. **Trascinare verticalmente**: Modifica l'asse Y (ry)
4. **Spostare il centro**: Modifica la posizione dell'ellisse

## Chiudere l'editor
- Clicca **fuori dalla zona blu** oppure
- Clicca il testo "Click qui per chiudere" in basso a sinistra

## Dettagli tecnici

### Cos'è il clip-path?
È una proprietà CSS che "taglia" un elemento con una forma arbitraria:
```css
/* Polygon */
clip-path: polygon(50% 0%, 0% 100%, 100% 100%);

/* Circle */
clip-path: circle(50% at 50% 50%);

/* Ellipse */
clip-path: ellipse(50% 35% at 50% 50%);
```

### Come si salvano i cambiamenti?
- Ogni modifica aggiorna il clip-path in tempo reale
- I valori si salvano automaticamente nello Zustand store
- Non devi premere niente - è tutto real-time

### Valori sempre in percentuale (%)
- X: 0% = sinistra, 100% = destra
- Y: 0% = top, 100% = bottom
- Raggio (circle): in percentuale della dimensione

## Esempi d'uso

### Caso 1: Modificare una stella
1. Seleziona un blocco con forma stella
2. Clicca il bottone Trasformazione Libera
3. Trascinai vertici della stella per renderla più/meno appuntita
4. Clicca chiudi

### Caso 2: Cambiare un cerchio in ellisse
1. Seleziona un blocco con cerchio
2. Attiva Trasformazione Libera
3. Trascinai punti Left/Right più lontano da Top/Bottom per creare un'ellisse
4. Salva modifiche quando è come vuoi

### Caso 3: Posizionare la forma nel blocco
1. Attiva Trasformazione Libera
2. Trascina il punto rosso (centro) dove vuoi
3. La forma si sposta mantenendo la forma relativa

## Troubleshooting

**Il bottone non appare**:
- Il bottone è visibile solo se il blocco ha una forma vettoriale
- Vai alla tab "Forma" nel pannello destro e assegna una forma

**Il drag non funziona**:
- Verifica che il blocco sia selezionato
- L'overlay non deve essere coperto da altri elementi
- Ricarica la pagina se ha problemi

**I valori saltano di colpo**:
- È il comportamento normale quando calcola il raggio
- Per circle/ellipse, i valori dipendono dal calcolo vettoriale

## Commit di riferimento
- `a471325` - Free transform editor implementation

---

**Creato**: 2026-03-21
**Status**: ✅ Production Ready
