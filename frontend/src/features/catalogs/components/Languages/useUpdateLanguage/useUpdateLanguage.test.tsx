import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { renderWithProviders, type RenderWithProvidersOptions } from "@/shared/testing";
import { isCatalogConflict } from "../../../utils";
import {
  updateLanguageMock as updateMock,
  updateLanguageRefusedMock as refusedMock,
} from "../languages.mocks";
import { useUpdateLanguage } from "./useUpdateLanguage";

// renderWithProviders renders elements; this small component lets the hook run inside the same providers.
function setup(options: RenderWithProvidersOptions) {
  let current!: ReturnType<typeof useUpdateLanguage>;
  function Probe(): ReactNode {
    current = useUpdateLanguage();
    return null;
  }
  renderWithProviders(<Probe />, options);
  return { result: () => current };
}

const input = { name: "German", iso: "DE", nativeName: "Deutsch (DE)" };

describe("useUpdateLanguage", () => {
  it("sends the id and the three fields, and resolves with the saved language", async () => {
    const { result } = setup({ mocks: [updateMock("2", input)] });

    await expect(result().update("2", input)).resolves.toMatchObject({ id: "2", ...input });
  });

  it("rejects with the CONFLICT error of a name another language has", async () => {
    const { result } = setup({ mocks: [refusedMock("2", input)] });

    const error = await result()
      .update("2", input)
      .catch((caught: unknown) => caught);

    expect(isCatalogConflict(error)).toBe(true);
  });
});
