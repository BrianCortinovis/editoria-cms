export interface AdFormat {
  name: string;
  width: number;
  height: number;
  label: string;
}

export const IAB_AD_FORMATS: AdFormat[] = [
  { name: 'leaderboard', width: 728, height: 90, label: 'Leaderboard (728x90)' },
  { name: 'medium-rectangle', width: 300, height: 250, label: 'Medium Rectangle (300x250)' },
  { name: 'large-rectangle', width: 336, height: 280, label: 'Large Rectangle (336x280)' },
  { name: 'half-page', width: 300, height: 600, label: 'Half Page (300x600)' },
  { name: 'wide-skyscraper', width: 160, height: 600, label: 'Wide Skyscraper (160x600)' },
  { name: 'skyscraper', width: 120, height: 600, label: 'Skyscraper (120x600)' },
  { name: 'billboard', width: 970, height: 250, label: 'Billboard (970x250)' },
  { name: 'mobile-banner', width: 320, height: 50, label: 'Mobile Banner (320x50)' },
  { name: 'large-mobile', width: 320, height: 100, label: 'Large Mobile (320x100)' },
  { name: 'square', width: 250, height: 250, label: 'Square (250x250)' },
  { name: 'small-square', width: 200, height: 200, label: 'Small Square (200x200)' },
  { name: 'banner', width: 468, height: 60, label: 'Banner (468x60)' },
  { name: 'full-banner', width: 728, height: 90, label: 'Full Banner (728x90)' },
  { name: 'portrait', width: 300, height: 1050, label: 'Portrait (300x1050)' },
  { name: 'pushdown', width: 970, height: 90, label: 'Pushdown (970x90)' },
];
