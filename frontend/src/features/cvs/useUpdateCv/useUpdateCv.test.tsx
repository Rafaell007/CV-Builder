import { act } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { renderWithProviders, type RenderWithProvidersOptions } from "@/shared/testing";
import { updateCvMock, updateCvNetworkErrorMock } from "../cvForm.mocks";
import type { CvListItem } from "../cvs.types";
import { useUpdateCv } from "./useUpdateCv";

const input = {
  id: "1",
  name: "Backend CV 2",
  education: "MSc Computer Science",
  description: "Five years of Node.js",
};

// renderWithProviders renders elements; this small component lets the hook run inside the same providers.
function setup(options: RenderWithProvidersOptions) {
  let current!: ReturnType<typeof useUpdateCv>;
  function Probe(): ReactNode {
    current = useUpdateCv();
    return null;
  }
  renderWithProviders(<Probe />, options);
  return { result: () => current };
}

describe("useUpdateCv", () => {
  it("resolves with the CV the backend saved", async () => {
    const { result } = setup({ mocks: [updateCvMock(input)] });

    let saved: CvListItem | undefined;
    await act(async () => {
      saved = await result().update(input);
    });

    expect(saved).toMatchObject({ id: "1", name: "Backend CV 2" });
  });

  it("rejects with the error of the request, so the form can keep its values", async () => {
    const { result } = setup({ mocks: [updateCvNetworkErrorMock(input)] });

    await act(async () => {
      await expect(result().update(input)).rejects.toThrow("Failed to fetch");
    });
  });
});
