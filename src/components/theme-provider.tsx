"use client";

import * as React from "react";

type Theme = "light" | "dark" | "system";
type ResolvedTheme = "light" | "dark";

interface ThemeProviderProps {
  attribute?: "class" | "data-theme";
  children: React.ReactNode;
  defaultTheme?: Theme;
  disableTransitionOnChange?: boolean;
  enableSystem?: boolean;
  storageKey?: string;
}

interface ThemeContextValue {
  forcedTheme?: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: React.Dispatch<React.SetStateAction<Theme>>;
  systemTheme: ResolvedTheme;
  theme: Theme;
  themes: Theme[];
}

const ThemeContext = React.createContext<ThemeContextValue | undefined>(
  undefined,
);

function getSystemTheme(): ResolvedTheme {
  if (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  ) {
    return "dark";
  }

  return "light";
}

function disableTransitionsTemporarily() {
  const style = document.createElement("style");
  style.appendChild(
    document.createTextNode("*,*::before,*::after{transition:none!important}"),
  );
  document.head.appendChild(style);
  window.getComputedStyle(document.body);
  window.setTimeout(() => style.remove(), 1);
}

export function ThemeProvider({
  attribute = "class",
  children,
  defaultTheme = "light",
  disableTransitionOnChange = false,
  enableSystem = true,
  storageKey = "theme",
}: ThemeProviderProps) {
  const [theme, setThemeState] = React.useState<Theme>(defaultTheme);
  const [systemTheme, setSystemTheme] = React.useState<ResolvedTheme>("light");

  React.useEffect(() => {
    setSystemTheme(getSystemTheme());

    try {
      const storedTheme = window.localStorage.getItem(
        storageKey,
      ) as Theme | null;
      if (
        storedTheme === "light" ||
        storedTheme === "dark" ||
        (enableSystem && storedTheme === "system")
      ) {
        setThemeState(storedTheme);
      }
    } catch {
      // Ignore blocked localStorage.
    }
  }, [enableSystem, storageKey]);

  React.useEffect(() => {
    if (!enableSystem) return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => setSystemTheme(getSystemTheme());
    mediaQuery.addEventListener("change", handleChange);

    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [enableSystem]);

  const resolvedTheme =
    theme === "system" && enableSystem
      ? systemTheme
      : theme === "dark"
        ? "dark"
        : "light";

  React.useEffect(() => {
    if (disableTransitionOnChange) {
      disableTransitionsTemporarily();
    }

    const root = document.documentElement;
    root.style.colorScheme = resolvedTheme;

    if (attribute === "class") {
      root.classList.remove("light", "dark");
      root.classList.add(resolvedTheme);
      return;
    }

    root.setAttribute(attribute, resolvedTheme);
  }, [attribute, disableTransitionOnChange, resolvedTheme]);

  const setTheme = React.useCallback<
    React.Dispatch<React.SetStateAction<Theme>>
  >(
    (value) => {
      setThemeState((currentTheme) => {
        const nextTheme =
          typeof value === "function" ? value(currentTheme) : value;

        try {
          window.localStorage.setItem(storageKey, nextTheme);
        } catch {
          // Ignore blocked localStorage.
        }

        return nextTheme;
      });
    },
    [storageKey],
  );

  const contextValue = React.useMemo<ThemeContextValue>(
    () => ({
      resolvedTheme,
      setTheme,
      systemTheme,
      theme,
      themes: enableSystem ? ["light", "dark", "system"] : ["light", "dark"],
    }),
    [enableSystem, resolvedTheme, setTheme, systemTheme, theme],
  );

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = React.useContext(ThemeContext);
  if (!context) {
    return {
      resolvedTheme: "light" as const,
      setTheme: () => undefined,
      systemTheme: "light" as const,
      theme: "light" as const,
      themes: ["light", "dark"],
    };
  }

  return context;
}
