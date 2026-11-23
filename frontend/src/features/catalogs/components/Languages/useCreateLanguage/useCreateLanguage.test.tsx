import { CombinedGraphQLErrors } from "@apollo/client";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { readFailure } from "@/shared/failures";
import { renderWithProviders, type RenderWithProvidersOptions } from "@/shared/testing";
import {
  createLanguageMock as createMock,
  createLanguageRefusedMock as refusedMock,
  ISO_TAKEN,
} from "../languages.mocks";
import { useCreateLanguage } from "./useCreateLanguage";

// renderWithProviders renders elements; this small component lets the hook run inside the same providers.
function setup(options: RenderWithProvidersOptions) {
  let current!: ReturnType<typeof useCreateLanguage>;
  function Probe(): ReactNode {
    current = useCreateLanguage();
    return null;
  }
  renderWithProviders(<Probe />, options);
  return { result: () => current };
}

const input = { name: "Czech", iso: "CS", nativeName: "Čeština" };

describe("useCreateLanguage", () => {
  it("sends the name, the ISO code and the native name, and resolves with the saved language", async () => {
    const { result } = setup({ mocks: [createMock(input)] });

    await expect(result().create(input)).resolves.toMatchObject({ id: "new-1", ...input });
  });

  it("rejects with the CONFLICT error of a taken name", async () => {
    const { result } = setup({ mocks: [refusedMock(input)] });

    const error = await result()
      .create(input)
      .catch((caught: unknown) => caught);

    expect(readFailure(error).kind).toBe("conflict");
  });

  it("rejects with the CONFLICT error and reason ISO_TAKEN of a taken ISO code", async () => {
    const { result } = setup({ mocks: [refusedMock(input, ISO_TAKEN)] });

    const error = await result()
      .create(input)
      .catch((caught: unknown) => caught);

    expect(CombinedGraphQLErrors.is(error) && error.errors[0]?.extensions).toEqual({
      code: "CONFLICT",
      reason: "ISO_TAKEN",
    });
  });
});
