import { create } from "zustand";

interface AIStatusState {
  active: boolean;
  message: string;
  provider: string;
  progress: number; // 0-100, -1 for indeterminate
  set: (status: Partial<Omit<AIStatusState, "set" | "clear">>) => void;
  clear: () => void;
}

export const useAIStatus = create<AIStatusState>((set) => ({
  active: false,
  message: "",
  provider: "",
  progress: -1,
  set: (status) => set({ active: true, ...status }),
  clear: () => set({ active: false, message: "", provider: "", progress: -1 }),
}));
