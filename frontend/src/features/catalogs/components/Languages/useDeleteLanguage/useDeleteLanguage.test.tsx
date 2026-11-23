import type { ApolloClient } from "@apollo/client";
import { useApolloClient } from "@apollo/client/react";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { renderWithProviders, type RenderWithProvidersOptions } from "@/shared/testing";
import { isCatalogConflict } from "../../../utils";
import {
  deleteLanguageMock as deleteMock,
  deleteLanguageRefusedMock as refusedMock,
} from "../languages.mocks";
import { useDeleteLanguage } from "./useDeleteLanguage";

// renderWithProviders renders elements; this small component lets the hook run inside the same providers.
function setup(options: RenderWithProvidersOptions) {
  let current!: ReturnType<typeof useDeleteLanguage>;
  let client!: ApolloClient;
  function Probe(): ReactNode {
    current = useDeleteLanguage();
    client = useApolloClient();
    return null;
  }
  renderWithProviders(<Probe />, options);
  return { result: () => current, client: () => client };
}

const czech = { __typename: "Language", id: "7", name: "Czech", iso: "CS", nativeName: "Čeština" };

describe("useDeleteLanguage", () => {
  it("resolves when the language was deleted, and removes it from the cache", async () => {
    const { result, client } = setup({ mocks: [deleteMock("7")] });
    client().cache.restore({ "Language:7": czech });

    await expect(result().remove("7")).resolves.toBeUndefined();

    expect(client().cache.extract()).not.toHaveProperty("Language:7");
  });

  it("rejects with the CONFLICT error of a language a user has", async () => {
    const { result } = setup({ mocks: [refusedMock("7")] });

    const error = await result()
      .remove("7")
      .catch((caught: unknown) => caught);

    expect(isCatalogConflict(error)).toBe(true);
  });
});
