import { act } from "@testing-library/react";
import { GraphQLError } from "graphql";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ResendVerificationCodeDocument } from "@/shared/graphql";
import { renderWithProviders, screen, type RenderWithProvidersOptions } from "@/shared/testing";
import { ResendCode } from "./index";

const SENT = { data: { resendVerificationCode: true } };

function resendMock(result: object, delay = 0) {
  return { request: { query: ResendVerificationCodeDocument }, result, delay };
}

function failure(code: string, reason?: string) {
  return {
    errors: [new GraphQLError("failed", { extensions: { code, ...(reason && { reason }) } })],
  };
}

const onSent = vi.fn();
const onAlreadyVerified = vi.fn();
const button = (name = "Resend code") => screen.getByRole("button", { name });

function renderResend(
  mocks: NonNullable<RenderWithProvidersOptions["mocks"]>,
  locale: "en" | "pl" = "en",
) {
  return renderWithProviders(<ResendCode onSent={onSent} onAlreadyVerified={onAlreadyVerified} />, {
    mocks,
    locale,
  });
}

describe("ResendCode", () => {
  beforeEach(() => {
    onSent.mockReset();
    onAlreadyVerified.mockReset();
    // The clock is faked so the countdown can be moved forward; user-event still needs time to pass.
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.spyOn(console, "error").mockImplementation(() => undefined); // the Apollo error link logs failures
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("sends a new code, tells the user and starts the wait", async () => {
    const { user } = renderResend([resendMock(SENT)]);

    await user.click(button());

    expect(await screen.findByRole("status")).toHaveTextContent("Verification code sent");
    expect(onSent).toHaveBeenCalledTimes(1);
    expect(button("Resend code in 60 s")).toBeDisabled();
  });

  it("counts down and allows a new request when the wait is over", async () => {
    const { user } = renderResend([resendMock(SENT)]);

    await user.click(button());
    await screen.findByRole("status");

    act(() => {
      vi.advanceTimersByTime(10_000);
    });
    expect(button("Resend code in 50 s")).toBeDisabled();

    act(() => {
      vi.advanceTimersByTime(50_000);
    });
    expect(button()).toBeEnabled();
  });

  it("is busy while the request runs and sends it only once", async () => {
    // One mock only: a second request would find no mock and show an error.
    const { user } = renderResend([resendMock(SENT, 500)]);

    await user.click(button());
    await user.click(button());

    expect(button()).toHaveAttribute("aria-busy", "true");
    expect(await screen.findByRole("status")).toBeInTheDocument();
    expect(onSent).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["the resend cooldown", failure("TOO_MANY_REQUESTS", "RESEND_COOLDOWN")],
    ["the throttler", failure("TOO_MANY_REQUESTS")],
  ])("asks the user to wait for %s and starts the wait", async (_name, result) => {
    const { user } = renderResend([resendMock(result)]);

    await user.click(button());

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Please wait before requesting another code",
    );
    expect(button("Resend code in 60 s")).toBeDisabled();
    expect(onSent).not.toHaveBeenCalled();
  });

  it("shows a friendly message for a server error and allows another try", async () => {
    const { user } = renderResend([resendMock(failure("INTERNAL_SERVER_ERROR"))]);

    await user.click(button());

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Something went wrong. Please try again later",
    );
    expect(button()).toBeEnabled();
  });

  it("shows a friendly message for a network error", async () => {
    const { user } = renderResend([
      { request: { query: ResendVerificationCodeDocument }, error: new Error("Failed to fetch") },
    ]);

    await user.click(button());

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Something went wrong. Please try again later",
    );
  });

  it.each([
    ["the resend cooldown", failure("TOO_MANY_REQUESTS", "RESEND_COOLDOWN")],
    ["the throttler", failure("TOO_MANY_REQUESTS")],
  ])("asks the user to wait for %s", async (_name, result) => {
    const { user } = renderResend([resendMock(result)]);

    await user.click(button());

    expect(await screen.findByRole("button", { name: "Resend code in 60 s" })).toBeDisabled();
  });

  it("tells the page when the account is verified already", async () => {
    const { user } = renderResend([resendMock(failure("CONFLICT", "ALREADY_VERIFIED"))]);

    await user.click(button());

    await vi.waitFor(() => expect(onAlreadyVerified).toHaveBeenCalledTimes(1));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows the texts in Polish", async () => {
    const { user } = renderResend([resendMock(SENT)], "pl");

    await user.click(screen.getByRole("button", { name: "Wyślij kod ponownie" }));

    expect(await screen.findByRole("status")).toHaveTextContent("Kod weryfikacyjny został wysłany");
    expect(screen.getByRole("button", { name: "Wyślij kod ponownie za 60 s" })).toBeDisabled();
  });
});
