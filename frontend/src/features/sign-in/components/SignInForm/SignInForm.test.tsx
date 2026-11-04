import type { MockLink } from "@apollo/client/testing";
import { describe, expect, it, vi } from "vitest";
import { SignInDocument } from "@/shared/graphql";
import { renderWithProviders, screen, waitFor } from "@/shared/testing";
import { SignInForm } from "./SignInForm";

const replace = vi.fn();
// Only the router is replaced: the test helpers need the rest of the module (routing).
vi.mock(import("@/shared/i18n"), async (importOriginal) => {
  const actual = await importOriginal();
  // The code under test only calls replace.
  return {
    ...actual,
    useRouter: () => ({ replace }) as unknown as ReturnType<typeof actual.useRouter>,
  };
});

const values = { email: "user@example.com", password: "secret1" };
const sessionUser = {
  __typename: "SessionUser" as const,
  id: "1",
  email: values.email,
  firstName: "Ann",
  lastName: "Lee",
  role: "USER" as const,
  isVerified: true,
};

function signInMock(
  result: NonNullable<MockLink.MockedResponse["result"]>,
): MockLink.MockedResponse {
  return { request: { query: SignInDocument, variables: { input: values } }, result };
}

const submitButton = () => screen.getByRole("button", { name: "Sign in" });

async function fillIn(user: ReturnType<typeof renderWithProviders>["user"], password = "secret1") {
  await user.type(screen.getByLabelText("Email"), values.email);
  await user.type(screen.getByLabelText("Password"), password);
}

describe("SignInForm", () => {
  it("has the email, the masked password, a disabled button and the forgot password link", () => {
    renderWithProviders(<SignInForm />);

    expect(screen.getByLabelText("Email")).toHaveAttribute("type", "email");
    expect(screen.getByLabelText("Password")).toHaveAttribute("type", "password");
    expect(submitButton()).toBeDisabled();
    expect(screen.getByRole("link", { name: "Forgot password" })).toHaveAttribute(
      "href",
      "/en/forgot-password",
    );
  });

  it("shows and hides the password with the eye button", async () => {
    const { user } = renderWithProviders(<SignInForm />);

    await user.click(screen.getByRole("button", { name: "Show password" }));
    expect(screen.getByLabelText("Password")).toHaveAttribute("type", "text");

    await user.click(screen.getByRole("button", { name: "Hide password" }));
    expect(screen.getByLabelText("Password")).toHaveAttribute("type", "password");
  });

  it("shows the messages inline when a field is left empty or wrong", async () => {
    const { user } = renderWithProviders(<SignInForm />);

    await user.click(screen.getByLabelText("Email"));
    await user.click(screen.getByLabelText("Password"));
    expect(await screen.findByText("Email is required")).toBeInTheDocument();

    await user.type(screen.getByLabelText("Email"), "not-an-email");
    await user.type(screen.getByLabelText("Password"), "123");
    await user.tab();

    expect(await screen.findByText("Please enter a valid email address")).toBeInTheDocument();
    expect(screen.getByText("Password must be at least 6 characters long")).toBeInTheDocument();
    expect(submitButton()).toBeDisabled();
  });

  it("enables the button only when both fields are valid", async () => {
    const { user } = renderWithProviders(<SignInForm />);

    await fillIn(user);

    await waitFor(() => expect(submitButton()).toBeEnabled());
  });

  it("signs in and opens the main page", async () => {
    replace.mockClear();
    const { user } = renderWithProviders(<SignInForm />, {
      mocks: [signInMock({ data: { signIn: sessionUser } })],
    });

    await fillIn(user);
    await waitFor(() => expect(submitButton()).toBeEnabled());
    await user.click(submitButton());

    await waitFor(() => expect(replace).toHaveBeenCalledWith("/users"));
  });

  it("shows the loading state and sends the request only once", async () => {
    const result = vi.fn(() => ({ data: { signIn: sessionUser } }));
    const { user } = renderWithProviders(<SignInForm />, {
      mocks: [{ ...signInMock({}), result, delay: 50 }],
    });

    await fillIn(user);
    await waitFor(() => expect(submitButton()).toBeEnabled());
    await user.click(submitButton());
    await user.click(submitButton());

    expect(submitButton()).toHaveAttribute("aria-busy", "true");
    await waitFor(() => expect(replace).toHaveBeenCalled());
    expect(result).toHaveBeenCalledOnce();
  });

  it("shows the wrong credentials message and keeps what was typed", async () => {
    const { user } = renderWithProviders(<SignInForm />, {
      mocks: [
        signInMock({
          errors: [
            { message: "Invalid email or password", extensions: { code: "UNAUTHENTICATED" } },
          ],
        }),
      ],
    });

    await fillIn(user);
    await waitFor(() => expect(submitButton()).toBeEnabled());
    await user.click(submitButton());

    // The message sits in a live region, so screen readers announce it.
    expect(await screen.findByText("Invalid email or password")).toHaveAttribute("role", "alert");
    expect(screen.getByLabelText("Email")).toHaveValue(values.email);
    expect(screen.getByLabelText("Password")).toHaveValue(values.password);
    expect(submitButton()).not.toHaveAttribute("aria-busy");
  });

  it("shows a friendly message for an unexpected error and keeps what was typed", async () => {
    const { user } = renderWithProviders(<SignInForm />, {
      mocks: [{ ...signInMock({}), error: new Error("Failed to fetch") }],
    });

    await fillIn(user);
    await waitFor(() => expect(submitButton()).toBeEnabled());
    await user.click(submitButton());

    expect(
      await screen.findByText("Something went wrong. Please try again later"),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toHaveValue(values.email);
  });

  it("is translated", () => {
    renderWithProviders(<SignInForm />, { locale: "pl" });

    expect(screen.getByRole("button", { name: "Zaloguj się" })).toBeInTheDocument();
  });
});
