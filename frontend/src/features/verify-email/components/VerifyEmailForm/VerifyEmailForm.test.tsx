import { GraphQLError } from "graphql";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MeDocument, VerifyEmailDocument } from "@/shared/graphql";
import { ALREADY_VERIFIED_REASON } from "@/shared/session";
import { renderWithProviders, screen, waitFor } from "@/shared/testing";
import { VerifyEmailForm } from "./index";

const push = vi.fn();
const replace = vi.fn();
// The real router needs the Next.js app router, which tests do not have. It adds the language itself.
vi.mock("@/shared/i18n", async (importOriginal) =>
  (await import("@/shared/testing/withMockedRouter")).withMockedRouter(
    await importOriginal<typeof import("@/shared/i18n")>(),
    () => ({ push, replace }),
  ),
);

const CODE = "123456";

function sessionUser(isVerified: boolean) {
  return {
    __typename: "SessionUser" as const,
    id: "1",
    email: "ann@example.com",
    firstName: null,
    lastName: null,
    role: "USER" as const,
    isVerified,
  };
}

function verifyMock(result: object, delay = 0) {
  return {
    request: { query: VerifyEmailDocument, variables: { input: { code: CODE } } },
    result,
    delay,
  };
}

const SUCCESS = { data: { verifyEmail: sessionUser(true) } };

function failure(code: string, reason?: string) {
  return {
    errors: [new GraphQLError("failed", { extensions: { code, ...(reason && { reason }) } })],
  };
}

const box = (position: number) => screen.getByRole("textbox", { name: `Digit ${position} of 6` });
const confirm = () => screen.getByRole("button", { name: "Confirm" });

async function enterCode(user: ReturnType<typeof renderWithProviders>["user"], code = CODE) {
  await user.click(box(1));
  await user.keyboard(code);
}

describe("VerifyEmailForm", () => {
  beforeEach(() => {
    push.mockReset();
    replace.mockReset();
    vi.spyOn(console, "error").mockImplementation(() => undefined); // the Apollo error link logs failures
  });

  it("shows six boxes, CONFIRM and LATER, which leads to the application", () => {
    renderWithProviders(<VerifyEmailForm />);

    expect(screen.getByRole("group", { name: "Verification code" })).toBeInTheDocument();
    expect(screen.getAllByRole("textbox")).toHaveLength(6);
    expect(confirm()).toBeEnabled();
    expect(screen.getByRole("link", { name: "Later" })).toHaveAttribute("href", "/en/users");
  });

  it("shows the form and its messages in Polish", async () => {
    const { user } = renderWithProviders(<VerifyEmailForm />, { locale: "pl" });

    await user.click(screen.getByRole("button", { name: "Potwierdź" }));

    expect(screen.getByText("Kod weryfikacyjny jest wymagany")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Później" })).toHaveAttribute("href", "/pl/users");
  });

  it("asks for a code and sends nothing when the boxes are empty", async () => {
    const { user } = renderWithProviders(<VerifyEmailForm />, { mocks: [verifyMock(SUCCESS)] });

    await user.click(confirm());

    expect(screen.getByRole("alert")).toHaveTextContent("Verification code is required");
    expect(push).not.toHaveBeenCalled();
  });

  it("refuses an incomplete code and sends nothing", async () => {
    const { user } = renderWithProviders(<VerifyEmailForm />, { mocks: [verifyMock(SUCCESS)] });

    await enterCode(user, "123");
    await user.click(confirm());

    expect(screen.getByRole("alert")).toHaveTextContent("Please enter a valid 6-digit code");
    expect(push).not.toHaveBeenCalled();
  });

  it("accepts a pasted code and sends it, then goes to the application", async () => {
    const { user } = renderWithProviders(<VerifyEmailForm />, { mocks: [verifyMock(SUCCESS)] });

    await user.click(box(1));
    await user.paste(CODE);
    await user.click(confirm());

    await waitFor(() => expect(push).toHaveBeenCalledWith("/users"));
  });

  it("is busy while the request runs, sends it only once and locks the boxes after the answer", async () => {
    // One mock only: a second request would find no mock and show an error.
    const { user } = renderWithProviders(<VerifyEmailForm />, {
      mocks: [verifyMock(SUCCESS, 50)],
    });

    await enterCode(user);
    await user.click(confirm());
    await user.click(confirm());

    // aria-disabled, not disabled: the shared Button keeps the focus while it is busy
    expect(confirm()).toHaveAttribute("aria-disabled", "true");
    expect(confirm()).toHaveAttribute("aria-busy", "true");
    await waitFor(() => expect(push).toHaveBeenCalledTimes(1));
    expect(confirm()).toHaveAttribute("aria-disabled", "true"); // still locked until the page changes
    expect(box(1)).toBeDisabled();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it.each([
    ["BAD_USER_INPUT", "CODE_INVALID", "Invalid verification code"],
    ["BAD_USER_INPUT", "CODE_EXPIRED", "Verification code has expired"],
    ["BAD_USER_INPUT", "CODE_USED", "Verification code has already been used"],
    ["TOO_MANY_REQUESTS", "TOO_MANY_ATTEMPTS", "Too many wrong codes. Request a new code"],
    ["TOO_MANY_REQUESTS", undefined, "Too many attempts, try again later"],
    ["INTERNAL_SERVER_ERROR", undefined, "Something went wrong. Please try again later"],
  ])("shows %s %s inline and keeps the code", async (code, reason, message) => {
    const { user } = renderWithProviders(<VerifyEmailForm />, {
      mocks: [verifyMock(failure(code, reason))],
    });

    await enterCode(user);
    await user.click(confirm());

    expect(await screen.findByRole("alert")).toHaveTextContent(message);
    expect(box(1)).toHaveValue("1");
    expect(box(6)).toHaveValue("6");
    expect(box(1)).toHaveAttribute("aria-invalid", "true");
    expect(confirm()).not.toHaveAttribute("aria-disabled");
    expect(push).not.toHaveBeenCalled();
  });

  it("shows a friendly message for a network error and keeps the code", async () => {
    const { user } = renderWithProviders(<VerifyEmailForm />, {
      mocks: [
        {
          request: { query: VerifyEmailDocument, variables: { input: { code: CODE } } },
          error: new Error("Failed to fetch"),
        },
      ],
    });

    await enterCode(user);
    await user.click(confirm());

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Something went wrong. Please try again later",
    );
    expect(box(6)).toHaveValue("6");
  });

  it.each([
    ["BAD_USER_INPUT", "CODE_INVALID", "Invalid verification code"],
    ["BAD_USER_INPUT", "CODE_EXPIRED", "Verification code has expired"],
    ["BAD_USER_INPUT", "CODE_USED", "Verification code has already been used"],
    ["TOO_MANY_REQUESTS", "TOO_MANY_ATTEMPTS", "Too many wrong codes. Request a new code"],
    ["TOO_MANY_REQUESTS", undefined, "Too many attempts, try again later"],
    ["BAD_USER_INPUT", "SOMETHING_NEW", "Something went wrong. Please try again later"],
    ["INTERNAL_SERVER_ERROR", undefined, "Something went wrong. Please try again later"],
  ])("shows the text for %s with the reason %s", async (code, reason, text) => {
    const { user } = renderWithProviders(<VerifyEmailForm />, {
      mocks: [verifyMock(failure(code, reason))],
    });

    await enterCode(user);
    await user.click(confirm());

    expect(await screen.findByRole("alert")).toHaveTextContent(text);
  });

  it("replaces the backend failure with the client check as soon as the user changes the code", async () => {
    const { user } = renderWithProviders(<VerifyEmailForm />, {
      mocks: [verifyMock(failure("BAD_USER_INPUT", "CODE_INVALID"))],
    });

    await enterCode(user);
    await user.click(confirm());
    expect(await screen.findByRole("alert")).toHaveTextContent("Invalid verification code");

    await user.click(box(6));
    await user.keyboard("{Backspace}");

    // The old failure is about the old code; the code is incomplete now.
    expect(screen.getByRole("alert")).toHaveTextContent("Please enter a valid 6-digit code");
  });

  it("sends a user whose account is verified already to the application", async () => {
    const { user } = renderWithProviders(<VerifyEmailForm />, {
      mocks: [verifyMock(failure("CONFLICT", ALREADY_VERIFIED_REASON))],
    });

    await enterCode(user);
    await user.click(confirm());

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/users"));
    expect(push).not.toHaveBeenCalled();
  });

  it("shows nothing and leaves for a user the backend knows as verified", async () => {
    renderWithProviders(<VerifyEmailForm />, {
      mocks: [{ request: { query: MeDocument }, result: { data: { me: sessionUser(true) } } }],
    });

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/users"));
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("keeps the form for a user who is not verified", async () => {
    renderWithProviders(<VerifyEmailForm />, {
      mocks: [{ request: { query: MeDocument }, result: { data: { me: sessionUser(false) } } }],
    });

    await waitFor(() => expect(screen.getAllByRole("textbox")).toHaveLength(6));
    expect(replace).not.toHaveBeenCalled();
  });
});
