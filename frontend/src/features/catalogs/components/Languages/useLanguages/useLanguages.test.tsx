import { act, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { renderWithProviders, type RenderWithProvidersOptions } from "@/shared/testing";
import {
  defaultVariables,
  english,
  german,
  languagesErrorMock,
  languagesMock,
  variablesFor,
} from "../languages.mocks";
import { useLanguages } from "./useLanguages";

// renderWithProviders renders elements; this small component lets the hook run inside the same providers.
function setup(options: RenderWithProvidersOptions, variables = defaultVariables) {
  let current!: ReturnType<typeof useLanguages>;
  function Probe(): ReactNode {
    current = useLanguages(variables);
    return null;
  }
  renderWithProviders(<Probe />, options);
  return { result: () => current };
}

describe("useLanguages", () => {
  it("is loading first, then returns the languages of the backend with their ISO code and native name", async () => {
    const { result } = setup({ mocks: [languagesMock([english, german])] });

    expect(result().loading).toBe(true);
    await waitFor(() => expect(result().loading).toBe(false));

    expect(result().items).toEqual([english, german]);
    expect(result().items[1]).toMatchObject({ iso: "DE", nativeName: "Deutsch" });
    expect(result().failed).toBe(false);
  });

  it("sends the search, the sort and the page to the backend and returns its total", async () => {
    const variables = variablesFor({
      page: { number: 2, size: 10 },
      search: "ger",
      sort: { field: "iso", direction: "DESC" },
    });
    // The mock answers only a request with exactly these variables.
    const { result } = setup(
      { mocks: [languagesMock([german], { variables, total: 11 })] },
      variables,
    );

    await waitFor(() => expect(result().loading).toBe(false));

    expect(result().items).toEqual([german]);
    expect(result().total).toBe(11);
  });

  it("reports a failed request and returns no languages", async () => {
    const { result } = setup({ mocks: [languagesErrorMock()] });

    await waitFor(() => expect(result().failed).toBe(true));
    expect(result().items).toEqual([]);
  });

  it("loads the languages again on retry", async () => {
    const { result } = setup({ mocks: [languagesErrorMock(), languagesMock([english])] });
    await waitFor(() => expect(result().failed).toBe(true));

    act(() => result().retry());

    await waitFor(() => expect(result().failed).toBe(false));
    expect(result().items).toHaveLength(1);
  });
});
