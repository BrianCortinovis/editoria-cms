import { create } from "zustand";

type Theme = "dark" | "light";

interface ThemeState {
  theme: Theme;
  hydrateTheme: () => void;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: "dark",
  hydrateTheme: () => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem("editoria_theme");
    const theme: Theme = stored === "light" || stored === "dark" ? stored : "dark";
    set({ theme });
    document.documentElement.setAttribute("data-theme", theme);
  },
  setTheme: (theme) => {
    set({ theme });
    if (typeof window !== "undefined") {
      localStorage.setItem("editoria_theme", theme);
      document.documentElement.setAttribute("data-theme", theme);
    }
  },
  toggleTheme: () => {
    const next = get().theme === "dark" ? "light" : "dark";
    get().setTheme(next);
  },
}));
