import type { MockLink } from "@apollo/client/testing";
import { MockedProvider } from "@apollo/client/testing/react";
import type { Decorator } from "@storybook/nextjs-vite";
import { useLayoutEffect } from "react";
import { PreferencesProvider, THEMES, usePreferences, type Theme } from "@/shared/preferences";

// Per-story GraphQL responses: `parameters: { apollo: { mocks: [...] } }`.
// A query without a matching mock gets an error, as in renderWithProviders.
type ApolloParameters = { mocks?: ReadonlyArray<MockLink.MockedResponse> };

const isTheme = (value: unknown): value is Theme => THEMES.some((theme) => theme === value);

// Saves the toolbar theme through the real preferences store (cookie + <html data-theme>),
// so the theme has one owner and stories run the same code path as the app.
function ThemeFromToolbar({ theme }: { theme: Theme }) {
  const { setTheme } = usePreferences();
  useLayoutEffect(() => setTheme(theme), [theme, setTheme]);
  return null;
}

// Wraps every story in the app's providers, like renderWithProviders in tests.
export const withAppProviders: Decorator = (Story, { globals, parameters }) => {
  const theme = isTheme(globals.theme) ? globals.theme : "light";
  const { mocks = [] }: ApolloParameters = parameters.apollo ?? {};

  return (
    <PreferencesProvider>
      <ThemeFromToolbar theme={theme} />
      <MockedProvider mocks={mocks}>
        <Story />
      </MockedProvider>
    </PreferencesProvider>
  );
};
