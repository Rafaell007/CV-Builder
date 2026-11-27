import { act } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { renderWithProviders, type RenderWithProvidersOptions } from "@/shared/testing";
import { createCvMock, createCvNetworkErrorMock, createInput } from "../cvForm.mocks";
import type { CvListItem } from "../cvs.types";
import { useCreateCv } from "./useCreateCv";

// renderWithProviders renders elements; this small component lets the hook run inside the same providers.
function setup(options: RenderWithProvidersOptions) {
  let current!: ReturnType<typeof useCreateCv>;
  function Probe(): ReactNode {
    current = useCreateCv();
    return null;
  }
  renderWithProviders(<Probe />, options);
  return { result: () => current };
}

describe("useCreateCv", () => {
  it("resolves with the CV the backend created", async () => {
    const { result } = setup({ mocks: [createCvMock(createInput, { id: "42" })] });

    let created: CvListItem | undefined;
    await act(async () => {
      created = await result().create(createInput);
    });

    expect(created).toMatchObject({ id: "42", name: "Frontend CV" });
  });

  it("rejects with the error of the request, so the form can keep its values", async () => {
    const { result } = setup({ mocks: [createCvNetworkErrorMock(createInput)] });

    await act(async () => {
      await expect(result().create(createInput)).rejects.toThrow("Failed to fetch");
    });
  });
});
