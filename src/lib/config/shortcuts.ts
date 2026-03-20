export interface ShortcutDef {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  description: string;
  action: string;
}

export const KEYBOARD_SHORTCUTS: ShortcutDef[] = [
  { key: 'z', ctrl: true, description: 'Annulla', action: 'undo' },
  { key: 'z', ctrl: true, shift: true, description: 'Ripristina', action: 'redo' },
  { key: 'y', ctrl: true, description: 'Ripristina', action: 'redo' },
  { key: 's', ctrl: true, description: 'Salva', action: 'save' },
  { key: 'c', ctrl: true, description: 'Copia blocco', action: 'copy' },
  { key: 'v', ctrl: true, description: 'Incolla blocco', action: 'paste' },
  { key: 'd', ctrl: true, description: 'Duplica blocco', action: 'duplicate' },
  { key: 'Delete', description: 'Elimina blocco', action: 'delete' },
  { key: 'Backspace', description: 'Elimina blocco', action: 'delete' },
  { key: 'Escape', description: 'Deseleziona', action: 'deselect' },
  { key: 'ArrowUp', alt: true, description: 'Sposta blocco su', action: 'move-up' },
  { key: 'ArrowDown', alt: true, description: 'Sposta blocco giù', action: 'move-down' },
  { key: 'p', ctrl: true, description: 'Preview', action: 'preview' },
  { key: 'e', ctrl: true, description: 'Export', action: 'export' },
  { key: '+', ctrl: true, description: 'Zoom in', action: 'zoom-in' },
  { key: '-', ctrl: true, description: 'Zoom out', action: 'zoom-out' },
  { key: '0', ctrl: true, description: 'Reset zoom', action: 'zoom-reset' },
];
