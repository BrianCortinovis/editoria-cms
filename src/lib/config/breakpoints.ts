export const BREAKPOINTS = {
  mobile: 768,
  tablet: 1024,
  desktop: 1440,
} as const;

export type DeviceMode = 'desktop' | 'tablet' | 'mobile';

export const DEVICE_WIDTHS: Record<DeviceMode, number> = {
  desktop: 1440,
  tablet: 768,
  mobile: 375,
};
