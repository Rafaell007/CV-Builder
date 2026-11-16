import { GraphQLError } from "graphql";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ChangePasswordDocument } from "@/shared/graphql";
import { renderWithProviders, screen, waitFor } from "@/shared/testing";
import { ChangePasswordForm } from "./index";

const CURRENT = "OldPassword1";
const PASSWORD = "Password123!";
const INPUT = { currentPassword: CURRENT, newPassword: PASSWORD };

function changePasswordMock(result: object, delay = 0) {
  return { request: { query: ChangePasswordDocument, variables: { input: INPUT } }, result, delay };
}

const SUCCESS = { data: { changePassword: true } };

function failure(code: string, reason?: string) {
  return {
    errors: [new GraphQLError("failed", { extensions: { code, ...(reason && { reason }) } })],
  };
}

const currentField = () => screen.getByLabelText("Password");
const newField = () => screen.getByLabelText("New Password");
const confirmField = () => screen.getByLabelText("Confirm Password");
const submit = () => screen.getByRole("button", { name: "Change" });

async function fillForm(user: ReturnType<typeof renderWithProviders>["user"]) {
  await user.type(currentField(), CURRENT);
  await user.type(newField(), PASSWORD);
  await user.type(confirmField(), PASSWORD);
}

describe("ChangePasswordForm", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => undefined); // the Apollo error link logs failures
  });

  it("shows the heading, three masked fields and a disabled CHANGE", () => {
    renderWithProviders(<ChangePasswordForm />);

    expect(screen.getByRole("heading", { level: 2, name: "Change password" })).toBeInTheDocument();
    expect(screen.getByRole("form", { name: "Change password" })).toBeInTheDocument();
    expect(currentField()).toHaveAttribute("type", "password");
    expect(newField()).toHaveAttribute("type", "password");
    expect(confirmField()).toHaveAttribute("type", "password");
    expect(submit()).toBeDisabled();
  });

  it("enables CHANGE only when every field is valid", async () => {
    const { user } = renderWithProviders(<ChangePasswordForm />);

    await user.type(currentField(), CURRENT);
    await user.type(newField(), PASSWORD);
    expect(submit()).toBeDisabled();

    await user.type(confirmField(), "Password124!");
    expect(submit()).toBeDisabled();

    await user.clear(confirmField());
    await user.type(confirmField(), PASSWORD);
    expect(submit()).toBeEnabled();
  });

  it("shows a field's message after the user leaves it", async () => {
    const { user } = renderWithProviders(<ChangePasswordForm />);

    await user.click(currentField());
    expect(screen.queryByText("Password is required")).not.toBeInTheDocument();

    await user.type(newField(), "Pass123");
    expect(screen.getByText("Password is required")).toBeInTheDocument();
    expect(
      screen.queryByText("Password must be at least 8 characters long"),
    ).not.toBeInTheDocument();

    await user.tab();
    expect(screen.getByText("Password must be at least 8 characters long")).toBeInTheDocument();
  });

  it("explains a weak new password and a confirmation that does not match", async () => {
    const { user } = renderWithProviders(<ChangePasswordForm />);

    await user.type(newField(), "PasswordOnly");
    await user.type(confirmField(), "Password123!");
    await user.tab();

    expect(
      screen.getByText("Password must contain at least one letter and one digit"),
    ).toBeInTheDocument();
    expect(screen.getByText("Passwords do not match")).toBeInTheDocument();
  });

  it("shows and hides each password", async () => {
    const { user } = renderWithProviders(<ChangePasswordForm />);

    await user.click(screen.getByRole("button", { name: "Show password" }));
    expect(currentField()).toHaveAttribute("type", "text");
    expect(newField()).toHaveAttribute("type", "password");

    await user.click(screen.getByRole("button", { name: "Show new password" }));
    expect(newField()).toHaveAttribute("type", "text");

    await user.click(screen.getByRole("button", { name: "Show confirm password" }));
    expect(confirmField()).toHaveAttribute("type", "text");

    await user.click(screen.getByRole("button", { name: "Hide password" }));
    expect(currentField()).toHaveAttribute("type", "password");
  });

  it("sends both passwords, then empties the form and shows a toast", async () => {
    const { user } = renderWithProviders(<ChangePasswordForm />, {
      mocks: [changePasswordMock(SUCCESS)],
    });

    await fillForm(user);
    await user.click(submit());

    expect(await screen.findByText("Password changed")).toBeInTheDocument();
    expect(currentField()).toHaveValue("");
    expect(newField()).toHaveValue("");
    expect(confirmField()).toHaveValue("");
    expect(screen.queryByText("Password is required")).not.toBeInTheDocument();
    expect(submit()).toBeDisabled();
  });

  it("is busy while the request runs, keeps the focus and sends it only once", async () => {
    // One mock only: a second request would find no mock and show an error.
    const { user } = renderWithProviders(<ChangePasswordForm />, {
      mocks: [changePasswordMock(SUCCESS, 500)],
    });

    await fillForm(user);
    await user.click(submit());

    // aria-disabled, not disabled: the shared Button keeps the focus while it is busy
    expect(submit()).toHaveAttribute("aria-busy", "true");
    expect(submit()).toHaveAttribute("aria-disabled", "true");
    expect(submit()).not.toBeDisabled();
    expect(submit()).toHaveFocus();

    await user.click(submit());
    expect(await screen.findByText("Password changed")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows a wrong current password under that field and keeps the values", async () => {
    const { user } = renderWithProviders(<ChangePasswordForm />, {
      mocks: [changePasswordMock(failure("BAD_USER_INPUT", "CURRENT_PASSWORD_INCORRECT"))],
    });

    await fillForm(user);
    await user.click(submit());

    expect(await screen.findByText("Current password is incorrect")).toBeInTheDocument();
    expect(currentField()).toHaveAccessibleDescription("Current password is incorrect");
    // Only the field's own message, nothing under the form.
    expect(screen.getAllByRole("alert")).toHaveLength(1);
    expect(currentField()).toHaveValue(CURRENT);
    expect(newField()).toHaveValue(PASSWORD);
    expect(confirmField()).toHaveValue(PASSWORD);

    await user.type(currentField(), "2");
    expect(screen.queryByText("Current password is incorrect")).not.toBeInTheDocument();
  });

  it.each([
    [
      "a server error",
      failure("INTERNAL_SERVER_ERROR"),
      "Something went wrong. Please try again later",
    ],
    ["a throttled request", failure("TOO_MANY_REQUESTS"), "Too many attempts, try again later"],
    ["other bad input", failure("BAD_USER_INPUT"), "Please check the entered values and try again"],
  ])("explains %s under the form and keeps the values", async (_, result, message) => {
    const { user } = renderWithProviders(<ChangePasswordForm />, {
      mocks: [changePasswordMock(result)],
    });

    await fillForm(user);
    await user.click(submit());

    expect(await screen.findByRole("alert")).toHaveTextContent(message);
    expect(currentField()).toHaveValue(CURRENT);
    expect(newField()).toHaveValue(PASSWORD);
    expect(submit()).toBeEnabled();
  });

  it("explains a network error", async () => {
    const { user } = renderWithProviders(<ChangePasswordForm />, {
      mocks: [
        {
          request: { query: ChangePasswordDocument, variables: { input: INPUT } },
          error: new Error("Failed to fetch"),
        },
      ],
    });

    await fillForm(user);
    await user.click(submit());

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Something went wrong. Please try again later",
    );
    await waitFor(() => expect(newField()).toHaveValue(PASSWORD));
  });

  it("shows the form and its messages in Polish", async () => {
    const { user } = renderWithProviders(<ChangePasswordForm />, { locale: "pl" });

    await user.type(screen.getByLabelText("Nowe hasło"), "Pass123");
    await user.tab();

    expect(screen.getByRole("heading", { level: 2, name: "Zmiana hasła" })).toBeInTheDocument();
    expect(screen.getByText("Hasło musi mieć co najmniej 8 znaków")).toBeInTheDocument();
  });
});
