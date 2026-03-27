"use client";

import { useEffect } from "react";
import { useThemeStore } from "@/lib/theme";

export default function ThemeInit() {
  const { theme, hydrateTheme } = useThemeStore();

  useEffect(() => {
    hydrateTheme();
  }, [hydrateTheme]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  return null;
}
