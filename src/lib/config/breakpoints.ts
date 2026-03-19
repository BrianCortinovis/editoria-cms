export type DeviceMode = 'desktop' | 'tablet' | 'mobile';

export const BREAKPOINTS: Record<DeviceMode, { width: number; label: string }> = {
  desktop: { width: 1440, label: 'Desktop' },
  tablet: { width: 768, label: 'Tablet' },
  mobile: { width: 375, label: 'Mobile' },
};

export const DEVICE_WIDTHS: Record<DeviceMode, number> = {
  desktop: 1440,
  tablet: 768,
  mobile: 375,
};
