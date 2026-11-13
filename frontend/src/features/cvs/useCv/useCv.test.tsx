import { act, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { renderWithProviders, type RenderWithProvidersOptions } from "@/shared/testing";
import { frontendCv } from "../cvs.mocks";
import { cvCodeErrorMock, cvMock, cvNetworkErrorMock } from "./cv.mocks";
import { useCv } from "./useCv";

// renderWithProviders renders elements; this small component lets the hook run inside the same providers.
function setup(options: RenderWithProvidersOptions, id = frontendCv.id) {
  let current!: ReturnType<typeof useCv>;
  function Probe(): ReactNode {
    current = useCv(id);
    return null;
  }
  renderWithProviders(<Probe />, options);
  return { result: () => current };
}

describe("useCv", () => {
  it("is loading first, then returns the CV of the backend", async () => {
    const { result } = setup({ mocks: [cvMock(frontendCv)] });

    expect(result().loading).toBe(true);
    await waitFor(() => expect(result().loading).toBe(false));

    expect(result().cv?.name).toBe("Frontend Developer");
    expect(result().failure).toBeUndefined();
  });

  it("reports notFound when the backend answers NOT_FOUND, and returns no CV", async () => {
    const { result } = setup({ mocks: [cvCodeErrorMock(frontendCv.id, "NOT_FOUND")] });

    await waitFor(() => expect(result().failure).toBe("notFound"));

    expect(result().cv).toBeUndefined();
  });

  it("reports forbidden when the backend answers FORBIDDEN", async () => {
    const { result } = setup({ mocks: [cvCodeErrorMock(frontendCv.id, "FORBIDDEN")] });

    await waitFor(() => expect(result().failure).toBe("forbidden"));
  });

  it("reports failed for a network error", async () => {
    const { result } = setup({ mocks: [cvNetworkErrorMock(frontendCv.id)] });

    await waitFor(() => expect(result().failure).toBe("failed"));
  });

  it("loads the CV again on retry", async () => {
    const { result } = setup({ mocks: [cvNetworkErrorMock(frontendCv.id), cvMock(frontendCv)] });
    await waitFor(() => expect(result().failure).toBe("failed"));

    act(() => result().retry());

    await waitFor(() => expect(result().failure).toBeUndefined());
    expect(result().cv?.id).toBe(frontendCv.id);
  });
});
