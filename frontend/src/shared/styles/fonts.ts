import { Roboto } from "next/font/google";

// App font (docs/design-tokens.md). The class sets --font-roboto, read by --font-family in tokens.css.
// Put roboto.variable on <html>: app/layout.tsx and .storybook/preview.tsx.
export const roboto = Roboto({
  variable: "--font-roboto",
  weight: ["400", "500", "600"],
  subsets: ["latin", "latin-ext"],
});
