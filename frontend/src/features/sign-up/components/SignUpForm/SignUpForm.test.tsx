import { GraphQLError } from "graphql";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SignUpDocument } from "@/shared/graphql";
import { renderWithProviders, screen, waitFor } from "@/shared/testing";
import { SignUpForm } from "./index";
import { SIGN_UP_MESSAGES } from "./utils";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

const EMAIL = "new@example.com";
const PASSWORD = "Password123!";
const INPUT = { email: EMAIL, password: PASSWORD };

function signUpMock(result: object, delay = 0) {
  return { request: { query: SignUpDocument, variables: { input: INPUT } }, result, delay };
}

const SUCCESS = {
  data: {
    signUp: {
      __typename: "SessionUser",
      id: "user-1",
      email: EMAIL,
      firstName: null,
      lastName: null,
      role: "USER",
      isVerified: false,
    },
  },
};

function failure(code: string) {
  return { errors: [new GraphQLError("failed", { extensions: { code } })] };
}

async function fillForm(
  user: ReturnType<typeof renderWithProviders>["user"],
  { email = EMAIL, password = PASSWORD, confirm = PASSWORD } = {},
) {
  if (email) await user.type(screen.getByLabelText("Email"), email);
  if (password) await user.type(screen.getByLabelText("Password"), password);
  if (confirm) await user.type(screen.getByLabelText("Confirm Password"), confirm);
}

const submit = () => screen.getByRole("button", { name: "Create account" });

describe("SignUpForm", () => {
  beforeEach(() => {
    push.mockReset();
    vi.spyOn(console, "error").mockImplementation(() => undefined); // the Apollo error link logs failures
  });

  it("shows the three fields, the button and the link to sign-in", () => {
    renderWithProviders(<SignUpForm />);

    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toHaveAttribute("type", "password");
    expect(screen.getByLabelText("Confirm Password")).toHaveAttribute("type", "password");
    expect(submit()).toBeEnabled();
    expect(screen.getByRole("link", { name: "I have an account" })).toHaveAttribute(
      "href",
      "/sign-in",
    );
  });

  it("does not send the request and shows every message when the fields are empty", async () => {
    const { user } = renderWithProviders(<SignUpForm />, { mocks: [signUpMock(SUCCESS)] });

    await user.click(submit());

    expect(screen.getByText(SIGN_UP_MESSAGES.emailRequired)).toBeInTheDocument();
    expect(screen.getByText(SIGN_UP_MESSAGES.passwordRequired)).toBeInTheDocument();
    expect(screen.getByText(SIGN_UP_MESSAGES.confirmRequired)).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });

  it("shows an error when a field is left, and removes it when the value becomes valid", async () => {
    const { user } = renderWithProviders(<SignUpForm />);

    await user.type(screen.getByLabelText("Email"), "not-an-email");
    await user.tab();
    expect(screen.getByText(SIGN_UP_MESSAGES.emailInvalid)).toBeInTheDocument();

    await user.clear(screen.getByLabelText("Email"));
    await user.type(screen.getByLabelText("Email"), EMAIL);
    expect(screen.queryByText(SIGN_UP_MESSAGES.emailInvalid)).not.toBeInTheDocument();
  });

  it("refuses a short password and a confirmation that does not match", async () => {
    const { user } = renderWithProviders(<SignUpForm />);

    await fillForm(user, { password: "Pass123", confirm: "Pass1234" });
    await user.click(submit());

    expect(screen.getByText(SIGN_UP_MESSAGES.passwordTooShort)).toBeInTheDocument();
    expect(screen.getByText(SIGN_UP_MESSAGES.confirmMismatch)).toBeInTheDocument();
  });

  it("shows and hides each password", async () => {
    const { user } = renderWithProviders(<SignUpForm />);

    await user.click(screen.getByRole("button", { name: "Show password" }));

    expect(screen.getByLabelText("Password")).toHaveAttribute("type", "text");
    expect(screen.getByLabelText("Confirm Password")).toHaveAttribute("type", "password");
  });

  it("sends the trimmed email and the password, then goes to the verification page", async () => {
    const { user } = renderWithProviders(<SignUpForm />, { mocks: [signUpMock(SUCCESS)] });

    await fillForm(user, { email: `  ${EMAIL} ` });
    await user.click(submit());

    await waitFor(() => expect(push).toHaveBeenCalledWith("/verify-email"));
  });

  it("is busy while the request runs and sends it only once", async () => {
    const { user } = renderWithProviders(<SignUpForm />, { mocks: [signUpMock(SUCCESS, 50)] });

    await fillForm(user);
    await user.click(submit());
    await user.click(submit());

    expect(submit()).toBeDisabled();
    expect(submit()).toHaveAttribute("aria-busy", "true");
    await waitFor(() => expect(push).toHaveBeenCalledTimes(1));
    expect(submit()).toBeDisabled(); // still locked until the page changes
  });

  it("shows a taken email under the email field and keeps the values", async () => {
    const { user } = renderWithProviders(<SignUpForm />, {
      mocks: [signUpMock(failure("CONFLICT"))],
    });

    await fillForm(user);
    await user.click(submit());

    expect(await screen.findByText(SIGN_UP_MESSAGES.emailTaken)).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toHaveAccessibleDescription(SIGN_UP_MESSAGES.emailTaken);
    expect(screen.getByLabelText("Email")).toHaveValue(EMAIL);
    expect(screen.getByLabelText("Password")).toHaveValue(PASSWORD);
    expect(screen.getByLabelText("Confirm Password")).toHaveValue(PASSWORD);
    expect(submit()).toBeEnabled();
    expect(push).not.toHaveBeenCalled();
  });

  it("removes the taken-email message when the email is changed", async () => {
    const { user } = renderWithProviders(<SignUpForm />, {
      mocks: [signUpMock(failure("CONFLICT"))],
    });
    await fillForm(user);
    await user.click(submit());
    await screen.findByText(SIGN_UP_MESSAGES.emailTaken);

    await user.type(screen.getByLabelText("Email"), "x");

    expect(screen.queryByText(SIGN_UP_MESSAGES.emailTaken)).not.toBeInTheDocument();
  });

  it("shows a friendly message for a server error and keeps the values", async () => {
    const { user } = renderWithProviders(<SignUpForm />, {
      mocks: [signUpMock(failure("INTERNAL_SERVER_ERROR"))],
    });

    await fillForm(user);
    await user.click(submit());

    expect(await screen.findByRole("alert")).toHaveTextContent(SIGN_UP_MESSAGES.unexpected);
    expect(screen.getByLabelText("Email")).toHaveValue(EMAIL);
    expect(push).not.toHaveBeenCalled();
  });

  it("shows a friendly message for a network error", async () => {
    const { user } = renderWithProviders(<SignUpForm />, {
      mocks: [
        {
          request: { query: SignUpDocument, variables: { input: INPUT } },
          error: new Error("Failed to fetch"),
        },
      ],
    });

    await fillForm(user);
    await user.click(submit());

    expect(await screen.findByRole("alert")).toHaveTextContent(SIGN_UP_MESSAGES.unexpected);
    expect(screen.getByLabelText("Password")).toHaveValue(PASSWORD);
  });

  it("explains a throttled request", async () => {
    const { user } = renderWithProviders(<SignUpForm />, {
      mocks: [signUpMock(failure("TOO_MANY_REQUESTS"))],
    });

    await fillForm(user);
    await user.click(submit());

    expect(await screen.findByRole("alert")).toHaveTextContent(SIGN_UP_MESSAGES.tooManyRequests);
  });
});
