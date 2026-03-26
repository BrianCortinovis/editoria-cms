// Block Templates - Preset grafici per blocchi
// Ogni template è un insieme di stili e configurazioni precotte

export interface BlockTemplate {
  id: string;
  name: string;
  category: 'banner' | 'slideshow' | 'gallery' | 'video' | 'carousel';
  preview: string; // URL preview
  defaultBlock: Record<string, any>;
}

export const BANNER_TEMPLATES: BlockTemplate[] = [
  {
    id: 'banner-1-dark-minimal',
    name: 'Dark Minimal',
    category: 'banner',
    preview: '#000',
    defaultBlock: {
      layout: { bg: '#000', padding: '40px 20px' },
      banners: [
        { title: 'Breaking News', subtitle: 'Latest updates', bg: '#1a1a1a', textColor: '#fff' },
        { title: 'Top Story', subtitle: 'Featured article', bg: '#2a2a2a', textColor: '#fff' },
      ],
      autoplay: true,
      transitionDuration: 500,
      transitionType: 'fade',
      overlayOpacity: 0.3,
      overlayColor: '#000',
    },
  },
  {
    id: 'banner-2-gradient-bold',
    name: 'Gradient Bold',
    category: 'banner',
    preview: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    defaultBlock: {
      layout: { bg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '50px 30px' },
      banners: [
        { title: 'Exclusive', subtitle: 'Premium content', bg: 'rgba(102, 126, 234, 0.8)', textColor: '#fff' },
        { title: 'Featured', subtitle: 'Hand picked', bg: 'rgba(118, 75, 162, 0.8)', textColor: '#fff' },
      ],
      autoplay: true,
      transitionDuration: 600,
      transitionType: 'slide',
      overlayOpacity: 0.4,
      overlayColor: '#000',
    },
  },
  {
    id: 'banner-3-vibrant-neon',
    name: 'Vibrant Neon',
    category: 'banner',
    preview: '#00d9ff',
    defaultBlock: {
      layout: { bg: '#0a0e27', padding: '30px 20px', borderBottom: '3px solid #00d9ff' },
      banners: [
        { title: 'Hot Topic', subtitle: 'Trending now', bg: '#00d9ff', textColor: '#0a0e27', fontWeight: 'bold' },
        { title: 'Breaking', subtitle: 'Live coverage', bg: '#ff006e', textColor: '#fff', fontWeight: 'bold' },
      ],
      autoplay: true,
      transitionDuration: 400,
      transitionType: 'fade',
      overlayOpacity: 0.5,
      overlayColor: '#000',
    },
  },
  {
    id: 'banner-4-clean-white',
    name: 'Clean White',
    category: 'banner',
    preview: '#fff',
    defaultBlock: {
      layout: { bg: '#f5f5f5', padding: '35px 25px', border: '1px solid #ddd' },
      banners: [
        { title: 'News Update', subtitle: 'Stay informed', bg: '#fff', textColor: '#333', borderLeft: '4px solid #0066cc' },
        { title: 'Highlights', subtitle: 'Must read', bg: '#fff', textColor: '#333', borderLeft: '4px solid #ff6600' },
      ],
      autoplay: true,
      transitionDuration: 700,
      transitionType: 'slide',
      overlayOpacity: 0,
      overlayColor: '#fff',
    },
  },
  {
    id: 'banner-5-dark-glass',
    name: 'Dark Glass',
    category: 'banner',
    preview: 'rgba(0,0,0,0.7)',
    defaultBlock: {
      layout: {
        bg: 'rgba(0, 0, 0, 0.7)',
        backdrop: 'blur(10px)',
        padding: '40px 30px',
      },
      banners: [
        { title: 'Premium News', subtitle: 'VIP section', bg: 'rgba(255, 255, 255, 0.1)', textColor: '#fff' },
        { title: 'Exclusive', subtitle: 'Members only', bg: 'rgba(255, 255, 255, 0.15)', textColor: '#fff' },
      ],
      autoplay: true,
      transitionDuration: 800,
      transitionType: 'fade',
      overlayOpacity: 0.6,
      overlayColor: '#000',
    },
  },
  {
    id: 'banner-6-colorful-split',
    name: 'Colorful Split',
    category: 'banner',
    preview: 'linear-gradient(90deg, #ff6b6b 0%, #4ecdc4 100%)',
    defaultBlock: {
      layout: { bg: '#fff', padding: '20px 0' },
      banners: [
        { title: 'Latest', subtitle: 'News digest', bg: '#ff6b6b', textColor: '#fff' },
        { title: 'Trending', subtitle: 'Top stories', bg: '#4ecdc4', textColor: '#fff' },
        { title: 'Featured', subtitle: 'Editor choice', bg: '#ffd93d', textColor: '#333' },
      ],
      autoplay: true,
      transitionDuration: 500,
      transitionType: 'slide',
      overlayOpacity: 0.2,
      overlayColor: '#000',
    },
  },
  {
    id: 'banner-7-corporate',
    name: 'Corporate',
    category: 'banner',
    preview: '#1e40af',
    defaultBlock: {
      layout: { bg: '#1e40af', padding: '45px 40px' },
      banners: [
        { title: 'Business News', subtitle: 'Market updates', bg: '#1e40af', textColor: '#fff' },
        { title: 'Analysis', subtitle: 'Expert insights', bg: '#1e3a8a', textColor: '#fff' },
      ],
      autoplay: true,
      transitionDuration: 900,
      transitionType: 'slide',
      overlayOpacity: 0.3,
      overlayColor: '#000',
    },
  },
  {
    id: 'banner-8-tech-modern',
    name: 'Tech Modern',
    category: 'banner',
    preview: '#0f172a',
    defaultBlock: {
      layout: { bg: '#0f172a', padding: '30px 20px', borderRadius: '8px', border: '1px solid #1e293b' },
      banners: [
        { title: 'Tech News', subtitle: 'Latest innovations', bg: '#1e293b', textColor: '#e2e8f0' },
        { title: 'Gadgets', subtitle: 'New releases', bg: '#334155', textColor: '#f1f5f9' },
      ],
      autoplay: true,
      transitionDuration: 400,
      transitionType: 'fade',
      overlayOpacity: 0.4,
      overlayColor: '#000',
    },
  },
  {
    id: 'banner-9-warm-sunset',
    name: 'Warm Sunset',
    category: 'banner',
    preview: 'linear-gradient(135deg, #ff7e5f 0%, #feb47b 100%)',
    defaultBlock: {
      layout: { bg: 'linear-gradient(135deg, #ff7e5f 0%, #feb47b 100%)', padding: '40px 30px', boxShadow: '0 8px 32px rgba(255, 126, 95, 0.3)' },
      banners: [
        { title: 'Hot Topics', subtitle: 'Trending stories', bg: 'rgba(255, 255, 255, 0.15)', textColor: '#fff' },
        { title: 'Must Read', subtitle: 'Editor picks', bg: 'rgba(255, 255, 255, 0.2)', textColor: '#fff' },
      ],
      autoplay: true,
      transitionDuration: 600,
      transitionType: 'slide',
      overlayOpacity: 0.3,
      overlayColor: '#000',
    },
  },
  {
    id: 'banner-10-minimal-line',
    name: 'Minimal Line',
    category: 'banner',
    preview: '#f0f0f0',
    defaultBlock: {
      layout: { bg: '#f0f0f0', padding: '20px', borderTop: '3px solid #ff0000', borderBottom: '3px solid #ff0000' },
      banners: [
        { title: 'Breaking', subtitle: 'Live updates', bg: '#fff', textColor: '#ff0000', fontWeight: 'bold' },
        { title: 'Alert', subtitle: 'Important news', bg: '#fff', textColor: '#ff0000', fontWeight: 'bold' },
      ],
      autoplay: true,
      transitionDuration: 500,
      transitionType: 'fade',
      overlayOpacity: 0,
      overlayColor: '#fff',
    },
  },
];

export const SLIDESHOW_TEMPLATES: BlockTemplate[] = [
  {
    id: 'slideshow-1-classic',
    name: 'Classic',
    category: 'slideshow',
    preview: '#fff',
    defaultBlock: {
      layout: { bg: '#fff', padding: '20px' },
      slides: [
        { image: '/placeholder.jpg', caption: 'Slide 1' },
        { image: '/placeholder.jpg', caption: 'Slide 2' },
      ],
      autoplay: true,
      autoplayInterval: 5000,
      transitionDuration: 500,
      showNavigation: true,
      showDots: true,
    },
  },
  {
    id: 'slideshow-2-dark-overlay',
    name: 'Dark Overlay',
    category: 'slideshow',
    preview: '#1a1a1a',
    defaultBlock: {
      layout: { bg: '#1a1a1a', padding: '0' },
      slides: [
        { image: '/placeholder.jpg', caption: 'Slide 1', overlayColor: '#000', overlayOpacity: 0.4 },
        { image: '/placeholder.jpg', caption: 'Slide 2', overlayColor: '#000', overlayOpacity: 0.4 },
      ],
      autoplay: true,
      autoplayInterval: 6000,
      transitionDuration: 600,
      showNavigation: true,
      showDots: true,
    },
  },
  {
    id: 'slideshow-3-minimal',
    name: 'Minimal',
    category: 'slideshow',
    preview: '#f5f5f5',
    defaultBlock: {
      layout: { bg: '#f5f5f5', padding: '10px' },
      slides: [
        { image: '/placeholder.jpg' },
        { image: '/placeholder.jpg' },
      ],
      autoplay: true,
      autoplayInterval: 7000,
      transitionDuration: 400,
      showNavigation: false,
      showDots: true,
    },
  },
  {
    id: 'slideshow-4-full-width',
    name: 'Full Width Hero',
    category: 'slideshow',
    preview: '#000',
    defaultBlock: {
      layout: { bg: '#000', padding: '0', height: '600px' },
      slides: [
        { image: '/placeholder.jpg', caption: 'Hero Slide 1', textPosition: 'center' },
        { image: '/placeholder.jpg', caption: 'Hero Slide 2', textPosition: 'center' },
      ],
      autoplay: true,
      autoplayInterval: 5000,
      transitionDuration: 700,
      showNavigation: true,
      showDots: false,
    },
  },
  {
    id: 'slideshow-5-card-layout',
    name: 'Card Layout',
    category: 'slideshow',
    preview: '#fff',
    defaultBlock: {
      layout: { bg: '#fff', padding: '30px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' },
      slides: [
        { image: '/placeholder.jpg', caption: 'Card 1', description: 'Description' },
        { image: '/placeholder.jpg', caption: 'Card 2', description: 'Description' },
      ],
      autoplay: true,
      autoplayInterval: 4000,
      transitionDuration: 500,
      showNavigation: true,
      showDots: true,
    },
  },
  {
    id: 'slideshow-6-gradient-frame',
    name: 'Gradient Frame',
    category: 'slideshow',
    preview: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    defaultBlock: {
      layout: {
        bg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '15px',
        borderRadius: '4px',
      },
      slides: [
        { image: '/placeholder.jpg' },
        { image: '/placeholder.jpg' },
      ],
      autoplay: true,
      autoplayInterval: 5000,
      transitionDuration: 600,
      showNavigation: true,
      showDots: true,
    },
  },
  {
    id: 'slideshow-7-bold-caption',
    name: 'Bold Caption',
    category: 'slideshow',
    preview: '#333',
    defaultBlock: {
      layout: { bg: '#333', padding: '20px' },
      slides: [
        { image: '/placeholder.jpg', caption: 'Bold Title', captionBg: '#ff6600', captionColor: '#fff' },
        { image: '/placeholder.jpg', caption: 'Another Title', captionBg: '#0066cc', captionColor: '#fff' },
      ],
      autoplay: true,
      autoplayInterval: 5500,
      transitionDuration: 500,
      showNavigation: true,
      showDots: true,
    },
  },
  {
    id: 'slideshow-8-no-nav',
    name: 'Auto Play Only',
    category: 'slideshow',
    preview: '#000',
    defaultBlock: {
      layout: { bg: '#000', padding: '0' },
      slides: [
        { image: '/placeholder.jpg' },
        { image: '/placeholder.jpg' },
        { image: '/placeholder.jpg' },
      ],
      autoplay: true,
      autoplayInterval: 4000,
      transitionDuration: 300,
      showNavigation: false,
      showDots: false,
    },
  },
  {
    id: 'slideshow-9-text-overlay',
    name: 'Text Overlay',
    category: 'slideshow',
    preview: '#222',
    defaultBlock: {
      layout: { bg: '#222', padding: '0', position: 'relative' },
      slides: [
        {
          image: '/placeholder.jpg',
          overlay: { position: 'bottom', text: 'Slide Title', bg: 'rgba(0,0,0,0.7)', color: '#fff' }
        },
        {
          image: '/placeholder.jpg',
          overlay: { position: 'bottom', text: 'Another Slide', bg: 'rgba(0,0,0,0.7)', color: '#fff' }
        },
      ],
      autoplay: true,
      autoplayInterval: 5000,
      transitionDuration: 400,
      showNavigation: true,
      showDots: true,
    },
  },
  {
    id: 'slideshow-10-compact',
    name: 'Compact Thumbnail',
    category: 'slideshow',
    preview: '#fff',
    defaultBlock: {
      layout: { bg: '#fff', padding: '8px' },
      slides: [
        { image: '/placeholder.jpg', caption: '1' },
        { image: '/placeholder.jpg', caption: '2' },
        { image: '/placeholder.jpg', caption: '3' },
      ],
      autoplay: true,
      autoplayInterval: 3000,
      transitionDuration: 300,
      showNavigation: false,
      showDots: true,
    },
  },
];

export const GALLERY_TEMPLATES: BlockTemplate[] = [
  {
    id: 'gallery-1-grid-3',
    name: '3 Column Grid',
    category: 'gallery',
    preview: '#f5f5f5',
    defaultBlock: {
      layout: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', padding: '20px' },
      images: Array(6).fill({ src: '/placeholder.jpg', alt: 'Image' }),
      spacing: 16,
      borderRadius: 0,
    },
  },
  {
    id: 'gallery-2-grid-4',
    name: '4 Column Grid',
    category: 'gallery',
    preview: '#fff',
    defaultBlock: {
      layout: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', padding: '15px' },
      images: Array(8).fill({ src: '/placeholder.jpg', alt: 'Image' }),
      spacing: 12,
      borderRadius: 4,
    },
  },
  {
    id: 'gallery-3-masonry',
    name: 'Masonry',
    category: 'gallery',
    preview: '#f0f0f0',
    defaultBlock: {
      layout: { display: 'grid', gridAutoFlow: 'dense', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', padding: '20px' },
      images: Array(12).fill({ src: '/placeholder.jpg', alt: 'Image' }),
      spacing: 16,
      borderRadius: 8,
    },
  },
  {
    id: 'gallery-4-carousel',
    name: 'Carousel',
    category: 'gallery',
    preview: '#000',
    defaultBlock: {
      layout: { display: 'flex', overflow: 'auto', padding: '20px', bg: '#000' },
      images: Array(5).fill({ src: '/placeholder.jpg', alt: 'Image' }),
      spacing: 16,
      borderRadius: 0,
      carousel: true,
    },
  },
  {
    id: 'gallery-5-minimal-frame',
    name: 'Minimal Frame',
    category: 'gallery',
    preview: '#fff',
    defaultBlock: {
      layout: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', padding: '20px', bg: '#fff', border: '1px solid #ddd' },
      images: Array(4).fill({ src: '/placeholder.jpg', alt: 'Image' }),
      spacing: 8,
      borderRadius: 0,
    },
  },
  {
    id: 'gallery-6-dark-gallery',
    name: 'Dark Gallery',
    category: 'gallery',
    preview: '#1a1a1a',
    defaultBlock: {
      layout: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', padding: '30px', bg: '#1a1a1a' },
      images: Array(9).fill({ src: '/placeholder.jpg', alt: 'Image' }),
      spacing: 20,
      borderRadius: 4,
    },
  },
  {
    id: 'gallery-7-single-row',
    name: 'Single Row',
    category: 'gallery',
    preview: '#f5f5f5',
    defaultBlock: {
      layout: { display: 'flex', gap: '20px', padding: '20px', overflowX: 'auto', bg: '#f5f5f5' },
      images: Array(6).fill({ src: '/placeholder.jpg', alt: 'Image' }),
      spacing: 20,
      borderRadius: 8,
    },
  },
  {
    id: 'gallery-8-lightbox',
    name: 'Lightbox Grid',
    category: 'gallery',
    preview: '#000',
    defaultBlock: {
      layout: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', padding: '20px', bg: '#000' },
      images: Array(8).fill({ src: '/placeholder.jpg', alt: 'Image' }),
      spacing: 10,
      borderRadius: 0,
      lightbox: true,
    },
  },
  {
    id: 'gallery-9-featured',
    name: 'Featured + Grid',
    category: 'gallery',
    preview: '#fff',
    defaultBlock: {
      layout: { display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '16px', padding: '20px' },
      images: Array(5).fill({ src: '/placeholder.jpg', alt: 'Image' }),
      spacing: 16,
      borderRadius: 4,
      featured: true,
    },
  },
  {
    id: 'gallery-10-overlay-text',
    name: 'Overlay Text',
    category: 'gallery',
    preview: '#333',
    defaultBlock: {
      layout: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', padding: '20px', position: 'relative' },
      images: Array(9).fill({ src: '/placeholder.jpg', alt: 'Image', overlay: true, text: 'Image Title' }),
      spacing: 12,
      borderRadius: 4,
    },
  },
];

export const VIDEO_TEMPLATES: BlockTemplate[] = [
  {
    id: 'video-1-simple',
    name: 'Simple Player',
    category: 'video',
    preview: '#000',
    defaultBlock: {
      layout: { bg: '#000', padding: '0', aspectRatio: '16 / 9' },
      videoUrl: 'https://example.com/video.mp4',
      controls: true,
      autoplay: false,
      muted: false,
      poster: '/placeholder.jpg',
    },
  },
  {
    id: 'video-2-with-description',
    name: 'With Description',
    category: 'video',
    preview: '#f5f5f5',
    defaultBlock: {
      layout: { bg: '#f5f5f5', padding: '20px', borderRadius: '8px', maxWidth: '800px' },
      videoUrl: 'https://example.com/video.mp4',
      title: 'Video Title',
      description: 'Video description goes here',
      controls: true,
      autoplay: false,
      muted: false,
    },
  },
  {
    id: 'video-3-hero',
    name: 'Full Width Hero',
    category: 'video',
    preview: '#1a1a1a',
    defaultBlock: {
      layout: { bg: '#1a1a1a', padding: '0', height: '600px', width: '100%' },
      videoUrl: 'https://example.com/video.mp4',
      controls: false,
      autoplay: true,
      muted: true,
      loop: true,
      overlay: true,
      overlayOpacity: 0.4,
    },
  },
  {
    id: 'video-4-minimal',
    name: 'Minimal',
    category: 'video',
    preview: '#fff',
    defaultBlock: {
      layout: { bg: '#fff', padding: '0', border: '1px solid #ddd', borderRadius: '4px' },
      videoUrl: 'https://example.com/video.mp4',
      controls: true,
      autoplay: false,
      muted: false,
      aspectRatio: '16 / 9',
    },
  },
  {
    id: 'video-5-dark-card',
    name: 'Dark Card',
    category: 'video',
    preview: '#222',
    defaultBlock: {
      layout: { bg: '#222', padding: '20px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' },
      videoUrl: 'https://example.com/video.mp4',
      title: 'Featured Video',
      controls: true,
      autoplay: false,
      muted: false,
    },
  },
  {
    id: 'video-6-embedded',
    name: 'Embedded (YouTube)',
    category: 'video',
    preview: '#000',
    defaultBlock: {
      layout: { bg: '#000', padding: '0' },
      videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      embedded: true,
      controls: true,
      allowFullscreen: true,
    },
  },
  {
    id: 'video-7-play-button',
    name: 'Play Button Overlay',
    category: 'video',
    preview: '#333',
    defaultBlock: {
      layout: { bg: '#333', padding: '0', position: 'relative', cursor: 'pointer' },
      videoUrl: 'https://example.com/video.mp4',
      poster: '/placeholder.jpg',
      playButtonStyle: 'large-centered',
      controls: true,
      autoplay: false,
    },
  },
  {
    id: 'video-8-with-related',
    name: 'With Related',
    category: 'video',
    preview: '#f0f0f0',
    defaultBlock: {
      layout: { bg: '#f0f0f0', padding: '20px' },
      videoUrl: 'https://example.com/video.mp4',
      title: 'Main Video',
      showRelated: true,
      relatedVideos: Array(3).fill({ id: '1', title: 'Related Video', thumbnail: '/placeholder.jpg' }),
      controls: true,
      autoplay: false,
    },
  },
  {
    id: 'video-9-transparent',
    name: 'Transparent Background',
    category: 'video',
    preview: 'rgba(255,255,255,0.1)',
    defaultBlock: {
      layout: { bg: 'transparent', padding: '0', border: '2px solid rgba(255,255,255,0.3)', borderRadius: '8px' },
      videoUrl: 'https://example.com/video.mp4',
      controls: true,
      autoplay: false,
      muted: false,
    },
  },
  {
    id: 'video-10-aspect-square',
    name: 'Square Video',
    category: 'video',
    preview: '#1a1a1a',
    defaultBlock: {
      layout: { bg: '#1a1a1a', padding: '10px', aspectRatio: '1 / 1' },
      videoUrl: 'https://example.com/video.mp4',
      controls: true,
      autoplay: false,
      muted: false,
    },
  },
];

export function getTemplatesByCategory(category: BlockTemplate['category']): BlockTemplate[] {
  const allTemplates = [
    ...BANNER_TEMPLATES,
    ...SLIDESHOW_TEMPLATES,
    ...GALLERY_TEMPLATES,
    ...VIDEO_TEMPLATES,
  ];
  return allTemplates.filter(t => t.category === category);
}

export function getTemplate(id: string): BlockTemplate | undefined {
  const allTemplates = [
    ...BANNER_TEMPLATES,
    ...SLIDESHOW_TEMPLATES,
    ...GALLERY_TEMPLATES,
    ...VIDEO_TEMPLATES,
  ];
  return allTemplates.find(t => t.id === id);
}
