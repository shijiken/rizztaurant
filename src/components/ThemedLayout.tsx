// src/components/ThemedLayout.tsx
import React, { ReactNode } from "react";
import { StatusBar } from "expo-status-bar";
import { useTheme } from "@/src/providers/ThemeProvider";

interface ThemedLayoutProps {
  children: ReactNode;
}

export function ThemedLayout({ children }: ThemedLayoutProps) {
  const { theme, isDark } = useTheme();

  return (
    <>
      <StatusBar
        style={isDark ? "light" : "dark"}
        backgroundColor={theme.background}
      />
      {children}
    </>
  );
}
