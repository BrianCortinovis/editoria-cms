import type { SiteTheme } from '@/types/database';

/**
 * Convert SiteTheme JSONB to CSS custom properties string.
 * Injected in the public site <head> as a <style> tag.
 */
export function themeToCSS(theme: SiteTheme | Record<string, unknown>): string {
  const t = theme as SiteTheme;
  if (!t?.colors) return '';

  const vars: string[] = [];

  // Colors
  if (t.colors) {
    for (const [key, value] of Object.entries(t.colors)) {
      vars.push(`--e-color-${key}: ${value}`);
    }
  }

  // Fonts
  if (t.fonts) {
    for (const [key, value] of Object.entries(t.fonts)) {
      vars.push(`--e-font-${key}: ${value}`);
    }
  }

  // Spacing
  if (t.spacing) {
    vars.push(`--e-spacing-unit: ${t.spacing.unit || 4}px`);
    vars.push(`--e-container-max: ${t.spacing.containerMax || '1200px'}`);
    vars.push(`--e-section-gap: ${t.spacing.sectionGap || '48px'}`);
  }

  // Border radius
  if (t.borderRadius) {
    vars.push(`--e-border-radius: ${t.borderRadius}`);
  }

  return `:root {\n  ${vars.join(';\n  ')};\n}`;
}
