import type { MockLink } from "@apollo/client/testing";
import { MockedProvider } from "@apollo/client/testing/react";
import { render, type RenderOptions, type RenderResult } from "@testing-library/react";
import userEvent, { type UserEvent } from "@testing-library/user-event";
import type { ReactElement, ReactNode } from "react";
import { PreferencesProvider } from "@/shared/preferences";

export type RenderWithProvidersOptions = Omit<RenderOptions, "wrapper"> & {
  // GraphQL responses for MockedProvider; a query without a matching mock gets an error.
  mocks?: ReadonlyArray<MockLink.MockedResponse>;
};

export type RenderWithProvidersResult = RenderResult & { user: UserEvent };

// Renders a component inside the app's providers and returns a user-event instance for interactions.
// The next-intl provider joins the wrapper in S0.6, so tests do not change.
export function renderWithProviders(
  ui: ReactElement,
  { mocks = [], ...options }: RenderWithProvidersOptions = {},
): RenderWithProvidersResult {
  // user-event recommends creating the instance before rendering.
  const user = userEvent.setup();

  function Providers({ children }: { children: ReactNode }) {
    return (
      <PreferencesProvider>
        <MockedProvider mocks={mocks}>{children}</MockedProvider>
      </PreferencesProvider>
    );
  }

  return { user, ...render(ui, { wrapper: Providers, ...options }) };
}
