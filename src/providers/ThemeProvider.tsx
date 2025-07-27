// src/providers/ThemeProvider.tsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { Appearance, ColorSchemeName } from "react-native";

// Define your theme colors
export const lightTheme = {
  background: "#ffffff",
  surface: "#f8f9fa",
  card: "#ffffff",
  text: "#000000",
  textSecondary: "#666666",
  textTertiary: "#888888",
  primary: "#007aff",
  primaryDark: "#0056cc",
  success: "#34c759",
  warning: "#ff9500",
  error: "#ff3b30",
  border: "#e1e5e9",
  shadow: "#000000",
  overlay: "rgba(0, 0, 0, 0.5)",
  // Status bar and navigation
  statusBarStyle: "dark-content" as const,
  navigationBarStyle: "light" as const,
};

export const darkTheme = {
  background: "#000000",
  surface: "#1c1c1e",
  card: "#2c2c2e",
  text: "#ffffff",
  textSecondary: "#ebebf5",
  textTertiary: "#8e8e93",
  primary: "#0a7aff",
  primaryDark: "#0056cc",
  success: "#32d74b",
  warning: "#ff9f0a",
  error: "#ff453a",
  border: "#38383a",
  shadow: "#000000",
  overlay: "rgba(0, 0, 0, 0.7)",
  // Status bar and navigation
  statusBarStyle: "light-content" as const,
  navigationBarStyle: "dark" as const,
};

export type Theme = typeof lightTheme;
export type ThemeMode = "light" | "dark" | "system";

interface ThemeContextType {
  theme: Theme;
  themeMode: ThemeMode;
  isDark: boolean;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [themeMode, setThemeMode] = useState<ThemeMode>("system");
  const [systemColorScheme, setSystemColorScheme] = useState<ColorSchemeName>(
    Appearance.getColorScheme()
  );

  // Listen to system theme changes
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemColorScheme(colorScheme);
    });

    return () => subscription?.remove();
  }, []);

  // Determine the current theme
  const getEffectiveTheme = (): "light" | "dark" => {
    if (themeMode === "system") {
      return systemColorScheme === "dark" ? "dark" : "light";
    }
    return themeMode;
  };

  const effectiveTheme = getEffectiveTheme();
  const isDark = effectiveTheme === "dark";
  const theme = isDark ? darkTheme : lightTheme;

  const toggleTheme = () => {
    if (themeMode === "system") {
      // If currently following system, switch to opposite of current system theme
      setThemeMode(systemColorScheme === "dark" ? "light" : "dark");
    } else if (themeMode === "light") {
      setThemeMode("dark");
    } else {
      setThemeMode("light");
    }
  };

  const contextValue: ThemeContextType = {
    theme,
    themeMode,
    isDark,
    setThemeMode,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
