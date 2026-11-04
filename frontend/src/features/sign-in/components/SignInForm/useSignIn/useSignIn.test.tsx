import type { MockLink } from "@apollo/client/testing";
import { act, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { SignInDocument } from "@/shared/graphql";
import { HOME_PATH } from "@/shared/session";
import { renderWithProviders } from "@/shared/testing";
import { useSignIn } from "./useSignIn";

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
const user = {
  __typename: "SessionUser" as const,
  id: "1",
  email: values.email,
  firstName: "Ann",
  lastName: "Lee",
  role: "USER" as const,
  isVerified: true,
};

const signInMock = (
  result: NonNullable<MockLink.MockedResponse["result"]>,
): MockLink.MockedResponse => ({
  request: { query: SignInDocument, variables: { input: values } },
  result,
});

// renderWithProviders renders elements; this small component lets the hook run inside the same providers.
function setup(mock: MockLink.MockedResponse) {
  let current!: ReturnType<typeof useSignIn>;
  function Probe(): ReactNode {
    current = useSignIn();
    return null;
  }
  renderWithProviders(<Probe />, { mocks: [mock] });
  return { result: () => current };
}

describe("useSignIn", () => {
  it("opens the main page after a successful request", async () => {
    const { result } = setup(signInMock({ data: { signIn: user } }));

    await act(() => result().signIn(values));

    expect(replace).toHaveBeenCalledWith(HOME_PATH);
  });

  it("reports wrong credentials and stays on the page", async () => {
    replace.mockClear();
    const { result } = setup(
      signInMock({
        errors: [{ message: "Invalid email or password", extensions: { code: "UNAUTHENTICATED" } }],
      }),
    );

    await act(() => result().signIn(values));

    await waitFor(() => expect(result().errorKind).toBe("invalidCredentials"));
    expect(result().pending).toBe(false);
    expect(replace).not.toHaveBeenCalled();
  });

  it("reports an unexpected error for a network failure", async () => {
    replace.mockClear();
    const { result } = setup({ ...signInMock({}), error: new Error("Failed to fetch") });

    await act(() => result().signIn(values));

    await waitFor(() => expect(result().errorKind).toBe("unexpected"));
    expect(replace).not.toHaveBeenCalled();
  });

  it("stays pending after success, while the next page opens", async () => {
    const { result } = setup(signInMock({ data: { signIn: user } }));

    await act(() => result().signIn(values));

    expect(result().pending).toBe(true);
  });
});
