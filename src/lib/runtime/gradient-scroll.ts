/**
 * Scroll and hover-driven gradient animations runtime
 * Pure JavaScript, no dependencies
 */

interface ScrollGradientConfig {
  elementId: string;
  startAngle: number;
  endAngle: number;
  stops: Array<{ color: string; position: number }>;
  type: 'linear' | 'radial' | 'conic';
}

interface HoverGradientConfig {
  elementId: string;
  baseGradient: string;
  hoverGradient: string;
}

function buildGradientCss(
  type: string,
  angle: number,
  stops: Array<{ color: string; position: number }>
): string {
  const sortedStops = [...stops].sort((a, b) => a.position - b.position);
  const stopsStr = sortedStops.map((s) => `${s.color} ${s.position}%`).join(', ');

  switch (type) {
    case 'linear':
      return `linear-gradient(${angle}deg, ${stopsStr})`;
    case 'radial':
      return `radial-gradient(circle, ${stopsStr})`;
    case 'conic':
      return `conic-gradient(from ${angle}deg, ${stopsStr})`;
    default:
      return `linear-gradient(${angle}deg, ${stopsStr})`;
  }
}

export function initializeScrollGradients(configs: ScrollGradientConfig[]) {
  const scrollHandler = () => {
    const scrollProgress = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);

    configs.forEach((config) => {
      const el = document.getElementById(config.elementId) as HTMLElement;
      if (!el) return;

      // Interpolate angle based on scroll progress
      const currentAngle = config.startAngle + (config.endAngle - config.startAngle) * scrollProgress;

      // Apply gradient
      const gradient = buildGradientCss(config.type, Math.round(currentAngle), config.stops);
      el.style.background = gradient;
    });
  };

  window.addEventListener('scroll', scrollHandler, { passive: true });
}

export function initializeHoverGradients(configs: HoverGradientConfig[]) {
  configs.forEach((config) => {
    const el = document.getElementById(config.elementId) as HTMLElement;
    if (!el) return;

    el.style.background = config.baseGradient;
    el.style.transition = 'background 0.3s ease';

    el.addEventListener('mouseenter', () => {
      el.style.background = config.hoverGradient;
    });

    el.addEventListener('mouseleave', () => {
      el.style.background = config.baseGradient;
    });
  });
}

// Auto-initialize on load
if (typeof window !== 'undefined' && document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    // Check for data attributes or window props
    const scrollConfigs = (window as any).__scrollGradients || [];
    const hoverConfigs = (window as any).__hoverGradients || [];

    if (scrollConfigs.length > 0) initializeScrollGradients(scrollConfigs);
    if (hoverConfigs.length > 0) initializeHoverGradients(hoverConfigs);
  });
} else if (typeof window !== 'undefined') {
  const scrollConfigs = (window as any).__scrollGradients || [];
  const hoverConfigs = (window as any).__hoverGradients || [];

  if (scrollConfigs.length > 0) initializeScrollGradients(scrollConfigs);
  if (hoverConfigs.length > 0) initializeHoverGradients(hoverConfigs);
}
