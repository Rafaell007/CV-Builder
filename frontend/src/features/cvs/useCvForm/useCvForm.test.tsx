import { CombinedGraphQLErrors } from "@apollo/client";
import { act } from "@testing-library/react";
import { useTranslations } from "next-intl";
import type { BaseSyntheticEvent, ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/shared/testing";
import type { CvFormValues } from "../cvs.types";
import { useCvForm } from "./useCvForm";

const defaultValues: CvFormValues = {
  name: "Backend CV",
  education: "MSc Computer Science",
  description: "Five years of Node.js",
};

// The submit handler only needs these two methods of the form event.
const fakeEvent = {
  preventDefault: () => undefined,
  persist: () => undefined,
} as unknown as BaseSyntheticEvent;

// renderWithProviders renders elements; this small component lets the hook run inside the same providers.
function setup() {
  let current!: ReturnType<typeof useCvForm>;
  let text!: ReturnType<typeof useTranslations<"cvs.form">>;
  function Probe(): ReactNode {
    current = useCvForm(defaultValues);
    text = useTranslations("cvs.form");
    return null;
  }
  renderWithProviders(<Probe />);
  return { result: () => current, t: () => text };
}

function badUserInput(field: string): CombinedGraphQLErrors {
  return new CombinedGraphQLErrors({
    errors: [
      {
        message: "Refused",
        extensions: { code: "BAD_USER_INPUT", fieldErrors: [{ field, messages: ["bad"] }] },
      },
    ],
  });
}

// A request that ends when the test says so.
function pendingSend() {
  const resolvers: (() => void)[] = [];
  const send = vi.fn(
    () =>
      new Promise<void>((resolve) => {
        resolvers.push(resolve);
      }),
  );
  return { send, finish: () => resolvers.forEach((resolve) => resolve()) };
}

describe("useCvForm", () => {
  it("shows a BAD_USER_INPUT error on name under the field and does not set failed", () => {
    const { result, t } = setup();

    act(() => result().showError(badUserInput("name")));

    expect(result().form.getFieldState("name").error).toMatchObject({
      type: "server",
      message: t()("errors.serverInvalid"),
    });
    expect(result().failed).toBe(false);
  });

  it.each(["name", "education", "description"] as const)(
    "shows the translated server text under %s",
    (field) => {
      const { result, t } = setup();

      act(() => result().showError(badUserInput(field)));

      expect(t()("errors.serverInvalid")).toBe("The server did not accept this value");
      expect(result().form.getFieldState(field).error).toMatchObject({
        type: "server",
        message: "The server did not accept this value",
      });
      expect(result().failed).toBe(false);
    },
  );

  it("clears a field error set by the server on reset", () => {
    const { result } = setup();
    act(() => result().showError(badUserInput("education")));
    expect(result().form.getFieldState("education").error).toBeDefined();

    act(() => result().reset(defaultValues));

    expect(result().form.getFieldState("education").error).toBeUndefined();
  });

  it("sets failed for a network error", () => {
    const { result } = setup();

    act(() => result().showError(new Error("Failed to fetch")));

    expect(result().failed).toBe(true);
  });

  it("sets failed for a BAD_USER_INPUT error on a field the form does not have", () => {
    const { result } = setup();

    act(() => result().showError(badUserInput("other")));

    expect(result().failed).toBe(true);
    expect(result().form.getFieldState("name").error).toBeUndefined();
  });

  it("clears failed on reset", () => {
    const { result } = setup();
    act(() => result().showError(new Error("Failed to fetch")));
    expect(result().failed).toBe(true);

    act(() => result().reset(defaultValues));

    expect(result().failed).toBe(false);
  });

  it("keeps failed when a submit fails validation", async () => {
    const { result } = setup();
    const send = vi.fn().mockResolvedValue(undefined);
    act(() => result().showError(new Error("Failed to fetch")));

    act(() => result().form.setValue("name", ""));
    await act(() => result().submit(fakeEvent, send));

    expect(send).not.toHaveBeenCalled();
    expect(result().failed).toBe(true);
  });

  it("ignores a second submit during a running submit", async () => {
    const { result } = setup();
    const { send, finish } = pendingSend();

    await act(async () => {
      const first = result().submit(fakeEvent, send);
      const second = result().submit(fakeEvent, send);
      // Let validation run for both; without the guard the second submit reaches send too.
      await new Promise((resolve) => setTimeout(resolve, 50));
      finish();
      await Promise.all([first, second]);
    });

    expect(send).toHaveBeenCalledTimes(1);
  });
});
