import { registerBlock } from '../registry';
import type { BlockDefinition } from '@/lib/types/block';

const sidebarBlock: BlockDefinition = {
  type: 'sidebar',
  label: 'Sidebar',
  description: 'Sidebar con widget: post recenti, categorie, tag, ricerca, archivi',
  icon: 'PanelRight',
  category: 'editorial',
  defaultProps: {
    widgets: [
      {
        id: '1', type: 'search', title: 'Cerca',
        props: { placeholder: 'Cerca nel sito...' },
      },
      {
        id: '2', type: 'recent-posts', title: 'Articoli Recenti',
        props: {
          posts: [
            { title: 'Post recente 1', url: '#', date: '2026-03-15' },
            { title: 'Post recente 2', url: '#', date: '2026-03-10' },
            { title: 'Post recente 3', url: '#', date: '2026-03-05' },
          ],
        },
      },
      {
        id: '3', type: 'categories', title: 'Categorie',
        props: {
          categories: [
            { name: 'Tecnologia', count: 12, url: '#' },
            { name: 'Design', count: 8, url: '#' },
            { name: 'Business', count: 5, url: '#' },
          ],
        },
      },
      {
        id: '4', type: 'tags', title: 'Tag',
        props: {
          tags: ['HTML', 'CSS', 'JavaScript', 'Design', 'UX', 'AI'],
        },
      },
    ],
    position: 'right',
    sticky: true,
  },
  defaultStyle: {
    layout: {
      display: 'flex',
      flexDirection: 'column',
      gap: '24px',
      padding: { top: '24px', right: '16px', bottom: '24px', left: '16px' },
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
      width: '100%',
      maxWidth: '320px',
    },
  },
  supportsChildren: false,
};

registerBlock(sidebarBlock);
