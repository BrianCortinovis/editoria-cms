"use client";

import { useEffect } from "react";
import { useThemeStore } from "@/lib/theme";

export default function ThemeInit() {
  const { theme } = useThemeStore();

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  return null;
}
