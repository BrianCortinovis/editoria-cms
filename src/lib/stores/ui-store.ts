'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { DeviceMode } from '@/lib/config/breakpoints';

export type Theme = 'dark' | 'light';

interface UiState {
  theme: Theme;
  deviceMode: DeviceMode;
  leftPanelOpen: boolean;
  rightPanelOpen: boolean;
  leftPanelTab: 'blocks' | 'layers';
  rightPanelTab: 'properties' | 'style' | 'animation' | 'shape' | 'responsive' | 'position' | 'tools' | 'gradient' | 'effects';
  hiddenRightPanelTabs: string[];
  aiPanelOpen: boolean;
  zoom: number;
  showGrid: boolean;
  gridSize: number;
  showOutlines: boolean;
  projectPalette: string[];
  previewMode: boolean;

  // Actions
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  setDeviceMode: (mode: DeviceMode) => void;
  setLeftPanelOpen: (open: boolean) => void;
  setRightPanelOpen: (open: boolean) => void;
  setLeftPanelTab: (tab: 'blocks' | 'layers') => void;
  setRightPanelTab: (tab: UiState['rightPanelTab']) => void;
  toggleHiddenRightPanelTab: (tab: string) => void;
  setAiPanelOpen: (open: boolean) => void;
  setZoom: (zoom: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  toggleGrid: () => void;
  setGridSize: (size: number) => void;
  toggleOutlines: () => void;
  setProjectPalette: (colors: string[]) => void;
  setPreviewMode: (on: boolean) => void;
  togglePreviewMode: () => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      theme: 'dark',
      deviceMode: 'desktop',
      leftPanelOpen: true,
      rightPanelOpen: true,
      leftPanelTab: 'blocks',
      rightPanelTab: 'properties',
      hiddenRightPanelTabs: [],
      aiPanelOpen: false,
      zoom: 1,
      showGrid: false,
      gridSize: 1,
      showOutlines: true,
      projectPalette: ['#1a1a2e', '#16213e', '#0f3460', '#e94560', '#ffffff', '#f1f1f1'],
      previewMode: false,

      setTheme: (theme) => set({ theme }),
      toggleTheme: () => set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),
      setDeviceMode: (deviceMode) => set({ deviceMode }),
      setLeftPanelOpen: (leftPanelOpen) => set({ leftPanelOpen }),
      setRightPanelOpen: (rightPanelOpen) => set({ rightPanelOpen }),
      setLeftPanelTab: (leftPanelTab) => set({ leftPanelTab }),
      setRightPanelTab: (rightPanelTab) => set({ rightPanelTab }),
      toggleHiddenRightPanelTab: (tab) =>
        set((s) => ({
          hiddenRightPanelTabs: s.hiddenRightPanelTabs.includes(tab)
            ? s.hiddenRightPanelTabs.filter((t) => t !== tab)
            : [...s.hiddenRightPanelTabs, tab],
        })),
      setAiPanelOpen: (aiPanelOpen) => set({ aiPanelOpen }),
      setZoom: (zoom) => set({ zoom: Math.max(0.25, Math.min(2, zoom)) }),
      zoomIn: () => set((s) => ({ zoom: Math.min(2, s.zoom + 0.1) })),
      zoomOut: () => set((s) => ({ zoom: Math.max(0.25, s.zoom - 0.1) })),
      resetZoom: () => set({ zoom: 1 }),
      toggleGrid: () => set((s) => ({ showGrid: !s.showGrid })),
      setGridSize: (gridSize) => set({ gridSize: Math.max(1, Math.min(100, gridSize)) }),
      toggleOutlines: () => set((s) => ({ showOutlines: !s.showOutlines })),
      setProjectPalette: (projectPalette) => set({ projectPalette }),
      setPreviewMode: (previewMode) => set({ previewMode }),
      togglePreviewMode: () => set((s) => ({ previewMode: !s.previewMode })),
    }),
    {
      name: 'editoria-ui-store',
    }
  )
);
