import type { MockLink } from "@apollo/client/testing";
import { MockedProvider } from "@apollo/client/testing/react";
import type { Decorator, Loader } from "@storybook/nextjs-vite";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { useLayoutEffect } from "react";
import { loadMessages, type Messages } from "@/i18n/loadMessages";
import { ToastProvider } from "@/shared/components/Toast";
import { routing } from "@/shared/i18n";
import { PreferencesProvider, THEMES, usePreferences, type Theme } from "@/shared/preferences";

// Per-story GraphQL responses: `parameters: { apollo: { mocks: [...] } }`.
// A query without a matching mock gets an error, as in renderWithProviders.
type ApolloParameters = { mocks?: ReadonlyArray<MockLink.MockedResponse> };

const isTheme = (value: unknown): value is Theme => THEMES.some((theme) => theme === value);
const localeOf = (value: unknown) =>
  hasLocale(routing.locales, value) ? value : routing.defaultLocale;

// Saves the toolbar theme through the real preferences store (cookie + <html data-theme>),
// so the theme has one owner and stories run the same code path as the app.
function ThemeFromToolbar({ theme }: { theme: Theme }) {
  const { setTheme } = usePreferences();
  useLayoutEffect(() => setTheme(theme), [theme, setTheme]);
  return null;
}

// In the app, app/[locale]/layout.tsx renders <html lang>; here the toolbar language sets it.
function LangFromToolbar({ locale }: { locale: string }) {
  useLayoutEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);
  return null;
}

// Loads the messages of the toolbar language before the story renders (they are imported asynchronously,
// as in the app). https://storybook.js.org/docs/writing-stories/loaders
export const loadAppMessages: Loader = async ({ globals }) => ({
  messages: await loadMessages(localeOf(globals.locale)),
});

// Wraps every story in the app's providers, like renderWithProviders in tests.
export const withAppProviders: Decorator = (Story, { globals, parameters, loaded }) => {
  const theme = isTheme(globals.theme) ? globals.theme : "light";
  const locale = localeOf(globals.locale);
  const { mocks = [] }: ApolloParameters = parameters.apollo ?? {};
  const { messages } = loaded as { messages: Messages };

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <PreferencesProvider>
        <ThemeFromToolbar theme={theme} />
        <LangFromToolbar locale={locale} />
        <MockedProvider mocks={mocks}>
          <ToastProvider
            closeLabel={messages.common.toast.close}
            label={messages.common.toast.label}
            viewportLabel={messages.common.toast.viewport}
          >
            <Story />
          </ToastProvider>
        </MockedProvider>
      </PreferencesProvider>
    </NextIntlClientProvider>
  );
};
