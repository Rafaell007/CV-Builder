import type { MockLink } from "@apollo/client/testing";
import { MockedProvider } from "@apollo/client/testing/react";
import { render, type RenderOptions, type RenderResult } from "@testing-library/react";
import userEvent, { type UserEvent } from "@testing-library/user-event";
import { NextIntlClientProvider, type Locale } from "next-intl";
import type { ReactElement, ReactNode } from "react";
import { loadMessages, type Messages } from "@/i18n/loadMessages";
// The folder, not the shared/components barrel: every test would load the whole kit, and component tests would import themselves in a cycle.
import { ToastProvider } from "@/shared/components/Toast";
import { routing } from "@/shared/i18n";
import { PreferencesProvider } from "@/shared/preferences";

export type RenderWithProvidersOptions = Omit<RenderOptions, "wrapper"> & {
  // GraphQL responses for MockedProvider; a query without a matching mock gets an error.
  mocks?: ReadonlyArray<MockLink.MockedResponse>;
  // Language of the rendered texts (default "en"); the real messages are used, so tests read real copy.
  locale?: Locale;
};

export type RenderWithProvidersResult = RenderResult & { user: UserEvent };

// Loaded once per test file: the same messages the app loads for each language.
// Test helpers sit outside the shared → app layering, because they wrap the whole app.
const messagesByLocale = Object.fromEntries(
  await Promise.all(
    routing.locales.map(async (locale) => [locale, await loadMessages(locale)] as const),
  ),
) as Record<Locale, Messages>;

// Renders a component inside the app's providers and returns a user-event instance for interactions.
export function renderWithProviders(
  ui: ReactElement,
  { mocks = [], locale = routing.defaultLocale, ...options }: RenderWithProvidersOptions = {},
): RenderWithProvidersResult {
  // user-event recommends creating the instance before rendering.
  const user = userEvent.setup();

  const messages = messagesByLocale[locale];

  function Providers({ children }: { children: ReactNode }) {
    return (
      <NextIntlClientProvider locale={locale} messages={messages}>
        <PreferencesProvider>
          <MockedProvider mocks={mocks}>
            <ToastProvider
              closeLabel={messages.common.toast.close}
              label={messages.common.toast.label}
              viewportLabel={messages.common.toast.viewport}
            >
              {children}
            </ToastProvider>
          </MockedProvider>
        </PreferencesProvider>
      </NextIntlClientProvider>
    );
  }

  return { user, ...render(ui, { wrapper: Providers, ...options }) };
}
