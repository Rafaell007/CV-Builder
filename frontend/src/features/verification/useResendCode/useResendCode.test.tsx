import { MockedProvider } from "@apollo/client/testing/react";
import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ResendVerificationCodeDocument } from "@/shared/graphql";
import { useResendCode } from "./useResendCode";

const mocks = [
  {
    request: { query: ResendVerificationCodeDocument },
    result: { data: { resendVerificationCode: true } },
  },
];

function wrapper({ children }: { children: ReactNode }) {
  return <MockedProvider mocks={mocks}>{children}</MockedProvider>;
}

describe("useResendCode", () => {
  // The clock still moves on its own, so the Apollo mock link (it answers on a timer) can respond.
  beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }));
  afterEach(() => vi.useRealTimers());

  it("counts the cooldown down to zero and then allows a new request", async () => {
    const { result } = renderHook(() => useResendCode(), { wrapper });

    await act(async () => {
      await result.current.resend();
    });
    expect(result.current.secondsLeft).toBe(60);

    // One act per second: the hook sets a new one-second timer after each render.
    for (let second = 0; second < 60; second++) {
      await act(async () => {
        await vi.advanceTimersByTimeAsync(1_000);
      });
    }
    expect(result.current.secondsLeft).toBe(0);
  });
});
