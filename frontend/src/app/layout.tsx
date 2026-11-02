import type { Metadata } from "next";
import { ApolloClientProvider } from "@/shared/apollo";
import { DEFAULT_LANGUAGE, PreferencesProvider, PreferencesScript } from "@/shared/preferences";
import { roboto } from "@/shared/styles";
import "@/shared/styles/global.css";

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
      <body>
        <ApolloClientProvider>
          <PreferencesProvider>{children}</PreferencesProvider>
        </ApolloClientProvider>
      </body>
    </html>
  );
}
