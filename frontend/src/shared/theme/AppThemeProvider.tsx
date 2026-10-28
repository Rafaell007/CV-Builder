"use client";

import type { ReactNode } from "react";
import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material/styles";
import { theme } from "./theme";

interface AppThemeProviderProps {
  children: ReactNode;
}

export const AppThemeProvider = ({ children }: AppThemeProviderProps) => (
  <ThemeProvider theme={theme}>
    <CssBaseline />
    {children}
  </ThemeProvider>
);
