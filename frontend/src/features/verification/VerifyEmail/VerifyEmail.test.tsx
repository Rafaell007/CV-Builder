import type { MockLink } from "@apollo/client/testing";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MeDocument, ResendVerificationCodeDocument, VerifyEmailDocument } from "@/shared/graphql";
import { renderWithProviders, screen, waitFor } from "@/shared/testing";
import { VerifyEmail } from "./VerifyEmail";

const replace = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace }) }));

function meMock(isVerified: boolean) {
  return {
    request: { query: MeDocument },
    result: {
      data: {
        me: {
          __typename: "SessionUser",
          id: "1",
          email: "a@b.c",
          firstName: null,
          lastName: null,
          role: "USER",
          isVerified,
        },
      },
    },
  };
}

function failure(reason: string) {
  return { errors: [{ message: "x", extensions: { reason } }] };
}

function verifyMock(code: string, reason?: string): MockLink.MockedResponse {
  return {
    request: { query: VerifyEmailDocument, variables: { input: { code } } },
    result: reason
      ? failure(reason)
      : { data: { verifyEmail: { __typename: "SessionUser", id: "1", isVerified: true } } },
  };
}

function resendMock(reason?: string): MockLink.MockedResponse {
  return {
    request: { query: ResendVerificationCodeDocument },
    result: reason ? failure(reason) : { data: { resendVerificationCode: true } },
  };
}

const codeField = () => screen.getByLabelText("Verification code");

describe("VerifyEmail", () => {
  beforeEach(() => replace.mockReset());

  it("shows the title, the instruction and the actions (AC-2)", () => {
    renderWithProviders(<VerifyEmail />, { mocks: [meMock(false)] });

    expect(screen.getByRole("heading", { name: "Email verification" })).toBeInTheDocument();
    expect(
      screen.getByText("Enter the verification code we sent to your email."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "CONFIRM" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "LATER" })).toHaveAttribute("href", "/users");
  });

  it("keeps only digits and at most 6 of them (AC-3, AC-5)", async () => {
    const { user } = renderWithProviders(<VerifyEmail />, { mocks: [meMock(false)] });

    await user.click(codeField());
    await user.paste("12a3-4567 89");

    expect(codeField()).toHaveValue("123456");
  });

  it("asks for a code and for 6 digits before it calls the backend", async () => {
    const { user } = renderWithProviders(<VerifyEmail />, { mocks: [meMock(false)] });

    await user.click(screen.getByRole("button", { name: "CONFIRM" }));
    expect(await screen.findByText("Verification code is required")).toBeInTheDocument();

    await user.type(codeField(), "123");
    await user.click(screen.getByRole("button", { name: "CONFIRM" }));
    expect(await screen.findByText("Please enter a valid 6-digit code")).toBeInTheDocument();
  });

  it("sends the code and goes to the app after success (AC-9, AC-14)", async () => {
    const { user } = renderWithProviders(<VerifyEmail />, {
      mocks: [meMock(false), verifyMock("123456")],
    });

    await user.type(codeField(), "123456");
    await user.click(screen.getByRole("button", { name: "CONFIRM" }));

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/users"));
    expect(screen.getByRole("button", { name: "CONFIRM" })).toBeDisabled();
  });

  it.each([
    ["CODE_INVALID", "Invalid verification code"],
    ["CODE_EXPIRED", "Verification code has expired"],
    ["CODE_USED", "Verification code has already been used"],
    ["TOO_MANY_ATTEMPTS", "Too many attempts. Request a new code"],
  ])("shows the %s error and keeps the typed code (AC-20, AC-21)", async (reason, message) => {
    const { user } = renderWithProviders(<VerifyEmail />, {
      mocks: [meMock(false), verifyMock("123456", reason)],
    });

    await user.type(codeField(), "123456");
    await user.click(screen.getByRole("button", { name: "CONFIRM" }));

    expect(await screen.findByText(message)).toBeInTheDocument();
    expect(codeField()).toHaveValue("123456");
    expect(replace).not.toHaveBeenCalled();
  });

  it("clears the error when the user edits the code", async () => {
    const { user } = renderWithProviders(<VerifyEmail />, {
      mocks: [meMock(false), verifyMock("123456", "CODE_INVALID")],
    });

    await user.type(codeField(), "123456");
    await user.click(screen.getByRole("button", { name: "CONFIRM" }));
    await screen.findByText("Invalid verification code");
    await user.type(codeField(), "{Backspace}");

    expect(screen.queryByText("Invalid verification code")).not.toBeInTheDocument();
  });

  it("requests a new code and starts the cooldown (AC-17)", async () => {
    const { user } = renderWithProviders(<VerifyEmail />, {
      mocks: [meMock(false), resendMock()],
    });

    await user.click(screen.getByRole("button", { name: "RESEND CODE" }));

    expect(await screen.findByText("Verification code sent")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "RESEND CODE (60s)" })).toBeDisabled();
  });

  it("shows the rate-limit message from the backend (AC-18)", async () => {
    const { user } = renderWithProviders(<VerifyEmail />, {
      mocks: [meMock(false), resendMock("RESEND_COOLDOWN")],
    });

    await user.click(screen.getByRole("button", { name: "RESEND CODE" }));

    expect(
      await screen.findByText("Please wait before requesting another code"),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "RESEND CODE (60s)" })).toBeDisabled();
  });

  it("sends a verified user to the app", async () => {
    renderWithProviders(<VerifyEmail />, { mocks: [meMock(true)] });

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/users"));
  });
});
