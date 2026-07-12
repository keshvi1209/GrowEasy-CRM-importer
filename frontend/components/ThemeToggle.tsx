"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import clsx from "clsx";

export const THEME_STORAGE_KEY = "groweasy-theme";
const THEME_EVENT = "groweasy-theme-change";

type Theme = "light" | "dark";

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  localStorage.setItem(THEME_STORAGE_KEY, theme);
  window.dispatchEvent(new CustomEvent<Theme>(THEME_EVENT, { detail: theme }));
}

interface ThemeToggleProps {
  className?: string;
  /**
   * "adaptive" follows the page theme (light card on light mode, dark card on
   * dark mode). "dark" is for use on surfaces that are always dark (e.g. the
   * sidebar), so the button chrome shouldn't flip to a light circle there.
   */
  surface?: "adaptive" | "dark";
}

export default function ThemeToggle({ className, surface = "adaptive" }: ThemeToggleProps) {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    setTheme(document.documentElement.classList.contains("dark") ? "dark" : "light");
    const onChange = (e: Event) => setTheme((e as CustomEvent<Theme>).detail);
    window.addEventListener(THEME_EVENT, onChange);
    return () => window.removeEventListener(THEME_EVENT, onChange);
  }, []);

  return (
    <button
      type="button"
      onClick={() => applyTheme(theme === "dark" ? "light" : "dark")}
      aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
      title={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
      className={clsx(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-colors",
        surface === "adaptive" &&
          "border-graphite-300 bg-white text-graphite-600 hover:border-teal-500 hover:text-teal-700 dark:border-graphite-700 dark:bg-graphite-800 dark:text-graphite-300 dark:hover:border-teal-500 dark:hover:text-teal-300",
        surface === "dark" &&
          "border-graphite-700 bg-graphite-800 text-graphite-300 hover:border-teal-500 hover:text-teal-300",
        className
      )}
    >
      {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
