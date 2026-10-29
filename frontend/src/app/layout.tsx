import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import { DEFAULT_LANGUAGE, PreferencesScript } from "@/shared/preferences";
import "@/shared/styles/global.css";

const roboto = Roboto({
  variable: "--font-roboto",
  weight: ["400", "500", "600"],
  subsets: ["latin", "latin-ext"],
});

export const metadata: Metadata = {
  title: "CV Builder",
  description: "Create, edit and preview CVs.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // suppressHydrationWarning: PreferencesScript changes data-theme and lang before React hydrates
    <html lang={DEFAULT_LANGUAGE} className={roboto.variable} suppressHydrationWarning>
      <head>
        <PreferencesScript />
      </head>
      <body>{children}</body>
    </html>
  );
}
