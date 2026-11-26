import type { ApolloClient } from "@apollo/client";
import { useApolloClient } from "@apollo/client/react";
import type { MockLink } from "@apollo/client/testing";
import { act, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MeDocument } from "@/shared/graphql";
import { renderWithProviders } from "@/shared/testing";
import {
  meMock,
  resendCodeMock,
  resendCodeNetworkErrorMock,
  resendCodeRefusedMock,
} from "../user-details.mocks";
import { useVerifyEmailRequest } from "./useVerifyEmailRequest";

const push = vi.fn();
vi.mock("@/shared/i18n", async (importOriginal) =>
  (await import("@/shared/testing/withMockedRouter")).withMockedRouter(
    await importOriginal<typeof import("@/shared/i18n")>(),
    () => ({ push, replace: vi.fn() }),
  ),
);

beforeEach(() => push.mockClear());

// renderWithProviders renders elements; this small component runs the hook inside the same providers (Apollo, toast).
// The cache holds the signed-in owner, not verified yet, as the page has loaded it.
function setup(mocks: MockLink.MockedResponse[]) {
  let current!: { client: ApolloClient; hook: ReturnType<typeof useVerifyEmailRequest> };
  function Probe(): ReactNode {
    current = { client: useApolloClient(), hook: useVerifyEmailRequest() };
    return null;
  }
  renderWithProviders(<Probe />, { mocks });
  const { data } = meMock("USER", false).result as { data: Record<string, unknown> };
  current.client.cache.writeQuery({ query: MeDocument, data });
  return {
    hook: () => current.hook,
    request: () => act(() => current.hook.request()),
    cachedMe: () => current.client.cache.readQuery({ query: MeDocument })?.me,
  };
}

describe("useVerifyEmailRequest", () => {
  it("sends a new code, shows a toast and opens the Email Verification page", async () => {
    const { hook, request, cachedMe } = setup([resendCodeMock()]);

    await request();

    expect(await screen.findByText("Verification email has been sent")).toBeInTheDocument();
    expect(push).toHaveBeenCalledWith("/verify-email");
    // Waiting for the new page: still busy, and the email is not marked as verified (AC-27).
    expect(hook().pending).toBe(true);
    expect(cachedMe()?.isVerified).toBe(false);
  });

  it("sends one request when VERIFY EMAIL is pressed twice at once", async () => {
    // One mock only: a second request would find none and show the error toast.
    const { hook } = setup([resendCodeMock()]);

    await act(() => Promise.all([hook().request(), hook().request()]));

    expect(push).toHaveBeenCalledTimes(1);
    expect(screen.queryByText("Failed to send verification email")).not.toBeInTheDocument();
  });

  it("is pending while the request runs", async () => {
    const { hook } = setup([resendCodeMock(50)]);

    let running!: Promise<void>;
    act(() => {
      running = hook().request();
    });
    expect(hook().pending).toBe(true);

    await act(() => running);
  });

  it("still opens the page when a code was sent less than a minute ago", async () => {
    const { request } = setup([
      resendCodeRefusedMock({ code: "TOO_MANY_REQUESTS", reason: "RESEND_COOLDOWN" }),
    ]);

    await request();

    expect(await screen.findByText("Check your email")).toBeInTheDocument();
    expect(push).toHaveBeenCalledWith("/verify-email");
  });

  it("stays and hides the button when the email is already verified", async () => {
    const { hook, request, cachedMe } = setup([
      resendCodeRefusedMock({ code: "CONFLICT", reason: "ALREADY_VERIFIED" }),
    ]);

    await request();

    expect(await screen.findByText("Your email is already verified")).toBeInTheDocument();
    expect(cachedMe()?.isVerified).toBe(true);
    expect(push).not.toHaveBeenCalled();
    expect(hook().pending).toBe(false);
  });

  it.each([
    ["no network", resendCodeNetworkErrorMock()],
    ["the throttler's answer", resendCodeRefusedMock({ code: "TOO_MANY_REQUESTS" })],
  ])("shows an error toast and stays on %s", async (_, mock) => {
    const { hook, request } = setup([mock]);

    await request();

    expect(await screen.findByText("Failed to send verification email")).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
    expect(hook().pending).toBe(false);
  });
});
