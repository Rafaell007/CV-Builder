import { CombinedGraphQLErrors } from "@apollo/client";
import { act } from "@testing-library/react";
import { useTranslations } from "next-intl";
import type { BaseSyntheticEvent, ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/shared/testing";
import type { ProjectFormValues } from "../projects.types";
import { useProjectForm } from "./useProjectForm";

const defaultValues: ProjectFormValues = {
  name: "CV Builder",
  domain: "cv-builder.example.com",
  startDate: new Date(2026, 0, 1),
  endDate: new Date(2026, 5, 1),
  description: "A tool to build CVs",
  environmentIds: [],
};

// The submit handler only needs these two methods of the form event.
const fakeEvent = {
  preventDefault: () => undefined,
  persist: () => undefined,
} as unknown as BaseSyntheticEvent;

// renderWithProviders renders elements; this small component lets the hook run inside the same providers.
function setup() {
  let current!: ReturnType<typeof useProjectForm>;
  let text!: ReturnType<typeof useTranslations<"projects.form">>;
  function Probe(): ReactNode {
    current = useProjectForm(defaultValues);
    text = useTranslations("projects.form");
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

describe("useProjectForm", () => {
  it.each(["name", "domain", "startDate", "description", "environmentIds"] as const)(
    "shows a BAD_USER_INPUT error on %s under the field with the serverInvalid text",
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

  it("shows the endDateBeforeStart text under endDate", () => {
    const { result, t } = setup();

    act(() => result().showError(badUserInput("endDate")));

    expect(t()("errors.endDateBeforeStart")).toBe("End date must be later than start date");
    expect(result().form.getFieldState("endDate").error).toMatchObject({
      type: "server",
      message: "End date must be later than start date",
    });
    expect(result().failed).toBe(false);
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
