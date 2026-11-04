import { GraphQLError } from "graphql";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ForgotPasswordDocument } from "@/shared/graphql";
import { renderWithProviders, screen } from "@/shared/testing";
import { ForgotPasswordForm } from "./index";

const EMAIL = "user@example.com";
const CONFIRMATION =
  "If an account with this email exists, you will receive password reset instructions.";

function forgotPasswordMock(result: object, delay = 0) {
  return {
    request: { query: ForgotPasswordDocument, variables: { input: { email: EMAIL } } },
    result,
    delay,
  };
}

const SUCCESS = { data: { forgotPassword: true } };

function failure(code: string) {
  return { errors: [new GraphQLError("failed", { extensions: { code } })] };
}

const submit = () => screen.getByRole("button", { name: "Reset password" });

describe("ForgotPasswordForm", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => undefined); // the Apollo error link logs failures
  });

  it("shows the email field, the button and the link back to sign-in", () => {
    renderWithProviders(<ForgotPasswordForm />);

    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(submit()).toBeEnabled();
    expect(screen.getByRole("link", { name: "Cancel" })).toHaveAttribute("href", "/en/sign-in");
  });

  it("shows the form and its messages in Polish", async () => {
    const { user } = renderWithProviders(<ForgotPasswordForm />, { locale: "pl" });

    await user.click(screen.getByRole("button", { name: "Zresetuj hasło" }));

    expect(screen.getByText("E-mail jest wymagany")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Anuluj" })).toHaveAttribute("href", "/pl/sign-in");
  });

  it("does not send the request when the email is empty", async () => {
    const { user } = renderWithProviders(<ForgotPasswordForm />, {
      mocks: [forgotPasswordMock(SUCCESS)],
    });

    await user.click(submit());

    expect(screen.getByText("Email is required")).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("shows an error when the email is left invalid, and removes it when it becomes valid", async () => {
    const { user } = renderWithProviders(<ForgotPasswordForm />);

    await user.type(screen.getByLabelText("Email"), "not-an-email");
    await user.tab();
    expect(screen.getByText("Please enter a valid email address")).toBeInTheDocument();

    await user.clear(screen.getByLabelText("Email"));
    await user.type(screen.getByLabelText("Email"), EMAIL);
    expect(screen.queryByText("Please enter a valid email address")).not.toBeInTheDocument();
  });

  it("sends the trimmed email and shows the confirmation instead of the form", async () => {
    const { user } = renderWithProviders(<ForgotPasswordForm />, {
      mocks: [forgotPasswordMock(SUCCESS)],
    });

    await user.type(screen.getByLabelText("Email"), `  ${EMAIL} `);
    await user.click(submit());

    expect(await screen.findByRole("status")).toHaveTextContent(CONFIRMATION);
    expect(screen.queryByLabelText("Email")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to sign in" })).toHaveAttribute(
      "href",
      "/en/sign-in",
    );
  });

  it("is busy while the request runs and sends it only once", async () => {
    // One mock only: a second request would find no mock and show an error.
    // The delay must outlast the two clicks below, which are slow on a loaded machine.
    const { user } = renderWithProviders(<ForgotPasswordForm />, {
      mocks: [forgotPasswordMock(SUCCESS, 500)],
    });

    await user.type(screen.getByLabelText("Email"), EMAIL);
    await user.click(submit());
    await user.click(submit());

    // aria-disabled, not disabled: the shared Button keeps the focus while it is busy
    expect(submit()).toHaveAttribute("aria-disabled", "true");
    expect(submit()).toHaveAttribute("aria-busy", "true");
    expect(await screen.findByRole("status")).toHaveTextContent(CONFIRMATION);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows a friendly message for a server error and keeps the email", async () => {
    const { user } = renderWithProviders(<ForgotPasswordForm />, {
      mocks: [forgotPasswordMock(failure("INTERNAL_SERVER_ERROR"))],
    });

    await user.type(screen.getByLabelText("Email"), EMAIL);
    await user.click(submit());

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Something went wrong. Please try again later",
    );
    expect(screen.getByLabelText("Email")).toHaveValue(EMAIL);
    expect(submit()).not.toHaveAttribute("aria-disabled");
  });

  it("shows a friendly message for a network error and keeps the email", async () => {
    const { user } = renderWithProviders(<ForgotPasswordForm />, {
      mocks: [
        {
          request: { query: ForgotPasswordDocument, variables: { input: { email: EMAIL } } },
          error: new Error("Failed to fetch"),
        },
      ],
    });

    await user.type(screen.getByLabelText("Email"), EMAIL);
    await user.click(submit());

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Something went wrong. Please try again later",
    );
    expect(screen.getByLabelText("Email")).toHaveValue(EMAIL);
  });

  it("explains a throttled request", async () => {
    const { user } = renderWithProviders(<ForgotPasswordForm />, {
      mocks: [forgotPasswordMock(failure("TOO_MANY_REQUESTS"))],
    });

    await user.type(screen.getByLabelText("Email"), EMAIL);
    await user.click(submit());

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Too many attempts, try again later",
    );
  });
});
