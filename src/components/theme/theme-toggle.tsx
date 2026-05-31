"use client";

import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme/theme-provider";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const isDark = theme === "dark";

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={toggleTheme}
      aria-label={mounted ? (isDark ? "Aktifkan light mode" : "Aktifkan dark mode") : "Tema"}
      title={mounted ? (isDark ? "Light mode" : "Dark mode") : "Tema"}
      className="gap-2"
    >
      {!mounted ? (
        <>
          <span className="inline-block size-4 animate-pulse rounded-full bg-slate-200 dark:bg-slate-700" />
          <span className="hidden sm:inline">...</span>
        </>
      ) : isDark ? (
        <>
          <Sun className="size-4 text-amber-500" />
          <span className="hidden sm:inline">Light</span>
        </>
      ) : (
        <>
          <Moon className="size-4 text-indigo-500" />
          <span className="hidden sm:inline">Dark</span>
        </>
      )}
    </Button>
  );
}
