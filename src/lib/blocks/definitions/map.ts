import { registerBlock } from '../registry';
import type { BlockDefinition } from '@/lib/types';

const mapBlock: BlockDefinition = {
  type: 'map',
  label: 'Mappa',
  description: 'Mappa Google Maps embed con marker e personalizzazione',
  icon: 'MapPin',
  category: 'interactive',
  defaultProps: {
    address: 'Milano, Italia',
    lat: 45.4642,
    lng: 9.19,
    zoom: 14,
    mapType: 'roadmap',
    height: '400px',
    showMarker: true,
    markerTitle: '',
  },
  defaultStyle: {
    layout: {
      display: 'block',
      padding: { top: '0', right: '0', bottom: '0', left: '0' },
      margin: { top: '24px', right: 'auto', bottom: '24px', left: 'auto' },
      width: '100%',
      maxWidth: '100%',
      overflow: 'hidden',
    },
    border: {
      radius: '8px',
    },
  },
  supportsChildren: false,
};

registerBlock(mapBlock);
