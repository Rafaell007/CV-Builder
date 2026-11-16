import { act, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { renderWithProviders, type RenderWithProvidersOptions } from "@/shared/testing";
import {
  cvPreviewCodeErrorMock,
  cvPreviewErrorMock,
  cvPreviewForbiddenMock,
  cvPreviewMock,
  cvPreviewSample,
} from "./cvPreview.mocks";
import { useCvPreview } from "./useCvPreview";

const cvId = cvPreviewSample.cvId;

// renderWithProviders renders elements; this small component lets the hook run inside the same providers.
function setup(options: RenderWithProvidersOptions) {
  let current!: ReturnType<typeof useCvPreview>;
  // Every `loading` value the hook returned, in order: a mock answers too fast to catch a short loading state by polling.
  const loadings: boolean[] = [];
  function Probe(): ReactNode {
    current = useCvPreview(cvId);
    loadings.push(current.loading);
    return null;
  }
  renderWithProviders(<Probe />, options);
  return { result: () => current, loadings };
}

describe("useCvPreview", () => {
  it("is loading first, then returns the preview of the backend", async () => {
    const { result } = setup({ mocks: [cvPreviewMock()] });

    expect(result().loading).toBe(true);
    await waitFor(() => expect(result().loading).toBe(false));

    expect(result().preview?.fullName).toBe("Anna Kowalska");
    expect(result().preview?.skillGroups).toHaveLength(2);
    expect(result().failed).toBe(false);
    expect(result().unauthorized).toBe(false);
  });

  it("reports failed for a network error, and returns no preview", async () => {
    const { result } = setup({ mocks: [cvPreviewErrorMock(cvId)] });

    await waitFor(() => expect(result().failed).toBe(true));

    expect(result().unauthorized).toBe(false);
    expect(result().preview).toBeUndefined();
  });

  it("loads the preview again on retry", async () => {
    const { result } = setup({ mocks: [cvPreviewErrorMock(cvId), cvPreviewMock()] });
    await waitFor(() => expect(result().failed).toBe(true));

    act(() => result().retry());

    await waitFor(() => expect(result().failed).toBe(false));
    expect(result().preview?.cvId).toBe(cvId);
  });

  it("is loading again during a retry, so the page shows the skeleton", async () => {
    const { result, loadings } = setup({ mocks: [cvPreviewErrorMock(cvId), cvPreviewMock()] });
    await waitFor(() => expect(result().failed).toBe(true));
    loadings.length = 0;

    act(() => result().retry());

    await waitFor(() => expect(result().preview?.cvId).toBe(cvId));
    expect(loadings).toContain(true);
    expect(result().loading).toBe(false);
  });

  it("reports unauthorized when the backend answers NOT_FOUND", async () => {
    const { result } = setup({ mocks: [cvPreviewCodeErrorMock(cvId, "NOT_FOUND")] });

    await waitFor(() => expect(result().unauthorized).toBe(true));

    expect(result().failed).toBe(false);
    expect(result().preview).toBeUndefined();
  });

  it("reports unauthorized when the backend answers FORBIDDEN", async () => {
    const { result } = setup({ mocks: [cvPreviewForbiddenMock(cvId)] });

    await waitFor(() => expect(result().unauthorized).toBe(true));

    expect(result().failed).toBe(false);
  });
});
