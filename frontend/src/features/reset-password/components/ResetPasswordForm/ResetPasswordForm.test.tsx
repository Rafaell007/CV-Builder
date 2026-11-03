import { GraphQLError } from "graphql";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ResetPasswordDocument } from "@/shared/graphql";
import { renderWithProviders, screen } from "@/shared/testing";
import { ResetPasswordForm } from "./index";

const TOKEN = "token-from-the-mail";
const PASSWORD = "Password123!";
const INPUT = { token: TOKEN, newPassword: PASSWORD };

function resetPasswordMock(result: object, delay = 0) {
  return { request: { query: ResetPasswordDocument, variables: { input: INPUT } }, result, delay };
}

const SUCCESS = { data: { resetPassword: true } };

function failure(code: string, reason?: string) {
  return {
    errors: [new GraphQLError("failed", { extensions: { code, ...(reason && { reason }) } })],
  };
}

async function fillForm(
  user: ReturnType<typeof renderWithProviders>["user"],
  { password = PASSWORD, confirm = PASSWORD } = {},
) {
  if (password) await user.type(screen.getByLabelText("New Password"), password);
  if (confirm) await user.type(screen.getByLabelText("Confirm Password"), confirm);
}

const submit = () => screen.getByRole("button", { name: "Submit" });

describe("ResetPasswordForm", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => undefined); // the Apollo error link logs failures
  });

  it("shows both fields masked, the button and the link to sign-in", () => {
    renderWithProviders(<ResetPasswordForm token={TOKEN} />);

    expect(screen.getByLabelText("New Password")).toHaveAttribute("type", "password");
    expect(screen.getByLabelText("Confirm Password")).toHaveAttribute("type", "password");
    expect(submit()).toBeEnabled();
    expect(screen.getByRole("link", { name: "Go to sign in" })).toHaveAttribute(
      "href",
      "/en/sign-in",
    );
  });

  it("shows the form and its messages in Polish", async () => {
    const { user } = renderWithProviders(<ResetPasswordForm token={TOKEN} />, { locale: "pl" });

    await user.type(screen.getByLabelText("Nowe hasło"), "Pass123");
    await user.click(screen.getByRole("button", { name: "Zatwierdź" }));

    expect(screen.getByText("Hasło musi mieć co najmniej 8 znaków")).toBeInTheDocument();
    expect(screen.getByText("Potwierdzenie hasła jest wymagane")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Przejdź do logowania" })).toHaveAttribute(
      "href",
      "/pl/sign-in",
    );
  });

  it("shows every message and sends nothing when the fields are empty", async () => {
    const { user } = renderWithProviders(<ResetPasswordForm token={TOKEN} />, {
      mocks: [resetPasswordMock(SUCCESS)],
    });

    await user.click(submit());

    expect(screen.getByText("Password is required")).toBeInTheDocument();
    expect(screen.getByText("Confirm Password is required")).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("refuses a weak password and a confirmation that does not match", async () => {
    const { user } = renderWithProviders(<ResetPasswordForm token={TOKEN} />);

    await fillForm(user, { password: "PasswordOnly", confirm: "Password123!" });
    await user.click(submit());

    expect(
      screen.getByText("Password must contain at least one letter and one digit"),
    ).toBeInTheDocument();
    expect(screen.getByText("Passwords do not match")).toBeInTheDocument();
  });

  it("shows and hides each password", async () => {
    const { user } = renderWithProviders(<ResetPasswordForm token={TOKEN} />);

    await user.click(screen.getByRole("button", { name: "Show password" }));
    expect(screen.getByLabelText("New Password")).toHaveAttribute("type", "text");
    expect(screen.getByLabelText("Confirm Password")).toHaveAttribute("type", "password");

    await user.click(screen.getByRole("button", { name: "Show confirm password" }));
    expect(screen.getByLabelText("Confirm Password")).toHaveAttribute("type", "text");

    await user.click(screen.getByRole("button", { name: "Hide password" }));
    expect(screen.getByLabelText("New Password")).toHaveAttribute("type", "password");
  });

  it("sends the token and the new password, then confirms and leads to sign-in", async () => {
    const { user } = renderWithProviders(<ResetPasswordForm token={TOKEN} />, {
      mocks: [resetPasswordMock(SUCCESS)],
    });

    await fillForm(user);
    await user.click(submit());

    expect(await screen.findByRole("status")).toHaveTextContent(
      "Your password was changed. You can sign in with the new password.",
    );
    expect(screen.queryByLabelText("New Password")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Go to sign in" })).toHaveAttribute(
      "href",
      "/en/sign-in",
    );
  });

  it("is busy while the request runs and sends it only once", async () => {
    // One mock only: a second request would find no mock and show an error.
    const { user } = renderWithProviders(<ResetPasswordForm token={TOKEN} />, {
      mocks: [resetPasswordMock(SUCCESS, 50)],
    });

    await fillForm(user);
    await user.click(submit());
    await user.click(submit());

    // aria-disabled, not disabled: the shared Button keeps the focus while it is busy
    expect(submit()).toHaveAttribute("aria-disabled", "true");
    expect(submit()).toHaveAttribute("aria-busy", "true");
    expect(await screen.findByRole("status")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it.each([
    ["RESET_TOKEN_INVALID", "This password reset link is invalid"],
    ["RESET_TOKEN_EXPIRED", "This password reset link has expired"],
    ["RESET_TOKEN_USED", "This password reset link has already been used"],
  ])("replaces the form with a notice for %s", async (reason, message) => {
    const { user } = renderWithProviders(<ResetPasswordForm token={TOKEN} />, {
      mocks: [resetPasswordMock(failure("BAD_USER_INPUT", reason))],
    });

    await fillForm(user);
    await user.click(submit());

    expect(await screen.findByRole("alert")).toHaveTextContent(message);
    expect(screen.queryByLabelText("New Password")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Request a new link" })).toHaveAttribute(
      "href",
      "/en/forgot-password",
    );
    expect(screen.getByRole("link", { name: "Go to sign in" })).toHaveAttribute(
      "href",
      "/en/sign-in",
    );
  });

  it("shows a friendly message for a server error and keeps the values", async () => {
    const { user } = renderWithProviders(<ResetPasswordForm token={TOKEN} />, {
      mocks: [resetPasswordMock(failure("INTERNAL_SERVER_ERROR"))],
    });

    await fillForm(user);
    await user.click(submit());

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Something went wrong. Please try again later",
    );
    expect(screen.getByLabelText("New Password")).toHaveValue(PASSWORD);
    expect(screen.getByLabelText("Confirm Password")).toHaveValue(PASSWORD);
    expect(submit()).not.toHaveAttribute("aria-disabled");
  });

  it("shows a friendly message for a network error and keeps the values", async () => {
    const { user } = renderWithProviders(<ResetPasswordForm token={TOKEN} />, {
      mocks: [
        {
          request: { query: ResetPasswordDocument, variables: { input: INPUT } },
          error: new Error("Failed to fetch"),
        },
      ],
    });

    await fillForm(user);
    await user.click(submit());

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Something went wrong. Please try again later",
    );
    expect(screen.getByLabelText("New Password")).toHaveValue(PASSWORD);
  });

  it("explains a throttled request", async () => {
    const { user } = renderWithProviders(<ResetPasswordForm token={TOKEN} />, {
      mocks: [resetPasswordMock(failure("TOO_MANY_REQUESTS"))],
    });

    await fillForm(user);
    await user.click(submit());

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Too many attempts, try again later",
    );
  });
});
