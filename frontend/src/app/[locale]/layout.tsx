import type { Metadata } from "next";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { ApolloClientProvider } from "@/shared/apollo";
// The folder, not the shared/components barrel: a Server Component would pull every component into the server graph.
import { ToastProvider } from "@/shared/components/Toast";
import { routing } from "@/shared/i18n";
import { PreferencesProvider, PreferencesScript } from "@/shared/preferences";
import { roboto } from "@/shared/styles";
import "@/shared/styles/global.css";

// Builds every page once per language at build time (static rendering with root params).
// https://next-intl.dev/blog/nextjs-root-params
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("common");
  return { title: t("appName"), description: t("appDescription") };
}

// The root layout: every route lives under /[locale] (PLAN D27).
export default async function RootLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const t = await getTranslations("common");

  return (
    // suppressHydrationWarning: PreferencesScript changes data-theme before React hydrates
    <html lang={locale} className={roboto.variable} suppressHydrationWarning>
      <head>
        <PreferencesScript />
      </head>
      <body>
        {/* Rendered on the server, it passes this request's locale and messages to Client Components. */}
        <NextIntlClientProvider>
          <ApolloClientProvider>
            <PreferencesProvider>
              <ToastProvider
                closeLabel={t("toast.close")}
                label={t("toast.label")}
                viewportLabel={t("toast.viewport")}
              >
                {children}
              </ToastProvider>
            </PreferencesProvider>
          </ApolloClientProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
