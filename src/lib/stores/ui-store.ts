'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { DeviceMode } from '@/lib/config/breakpoints';

export type BuilderTheme = 'dark' | 'light';

interface UiState {
  theme: BuilderTheme;
  deviceMode: DeviceMode;
  leftPanelOpen: boolean;
  rightPanelOpen: boolean;
  leftPanelTab: 'blocks' | 'layers';
  rightPanelTab: 'properties' | 'style' | 'shape' | 'responsive' | 'animation' | 'position' | 'tools';
  aiPanelOpen: boolean;
  zoom: number;
  showGrid: boolean;
  gridSize: number;
  showOutlines: boolean;
  previewMode: boolean;

  setTheme: (theme: BuilderTheme) => void;
  toggleTheme: () => void;
  setDeviceMode: (mode: DeviceMode) => void;
  setLeftPanelOpen: (open: boolean) => void;
  setRightPanelOpen: (open: boolean) => void;
  setLeftPanelTab: (tab: 'blocks' | 'layers') => void;
  setRightPanelTab: (tab: UiState['rightPanelTab']) => void;
  setAiPanelOpen: (open: boolean) => void;
  setZoom: (zoom: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  toggleGrid: () => void;
  setGridSize: (size: number) => void;
  toggleOutlines: () => void;
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
      aiPanelOpen: false,
      zoom: 1,
      showGrid: false,
      gridSize: 1,
      showOutlines: true,
      previewMode: false,

      setTheme: (theme) => set({ theme }),
      toggleTheme: () => set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),
      setDeviceMode: (deviceMode) => set({ deviceMode }),
      setLeftPanelOpen: (leftPanelOpen) => set({ leftPanelOpen }),
      setRightPanelOpen: (rightPanelOpen) => set({ rightPanelOpen }),
      setLeftPanelTab: (leftPanelTab) => set({ leftPanelTab }),
      setRightPanelTab: (rightPanelTab) => set({ rightPanelTab }),
      setAiPanelOpen: (aiPanelOpen) => set({ aiPanelOpen }),
      setZoom: (zoom) => set({ zoom: Math.max(0.25, Math.min(2, zoom)) }),
      zoomIn: () => set((s) => ({ zoom: Math.min(2, s.zoom + 0.1) })),
      zoomOut: () => set((s) => ({ zoom: Math.max(0.25, s.zoom - 0.1) })),
      resetZoom: () => set({ zoom: 1 }),
      toggleGrid: () => set((s) => ({ showGrid: !s.showGrid })),
      setGridSize: (gridSize) => set({ gridSize: Math.max(1, Math.min(100, gridSize)) }),
      toggleOutlines: () => set((s) => ({ showOutlines: !s.showOutlines })),
      setPreviewMode: (previewMode) => set({ previewMode }),
      togglePreviewMode: () => set((s) => ({ previewMode: !s.previewMode })),
    }),
    {
      name: 'editoria-builder-ui',
      partialize: (state) => ({
        theme: state.theme,
        showGrid: state.showGrid,
        gridSize: state.gridSize,
        showOutlines: state.showOutlines,
      }),
    }
  )
);
