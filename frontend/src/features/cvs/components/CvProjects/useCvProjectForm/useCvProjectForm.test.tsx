import { CombinedGraphQLErrors } from "@apollo/client";
import { act } from "@testing-library/react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "@/shared/testing";
import { useCvProjectForm } from "./useCvProjectForm";

// No project has a known range, so the form rules do not matter here.
const rangeOf = () => undefined;

// renderWithProviders renders elements; this small component lets the hook run inside the same providers.
function setup() {
  let current!: ReturnType<typeof useCvProjectForm>;
  let text!: ReturnType<typeof useTranslations<"cvs.projects.form.errors">>;
  function Probe(): ReactNode {
    current = useCvProjectForm(rangeOf);
    text = useTranslations("cvs.projects.form.errors");
    return null;
  }
  renderWithProviders(<Probe />);
  return { result: () => current, t: () => text };
}

type FieldError = { field: string; messages: string[]; reasons?: string[] };

function refused(code: string, fieldErrors?: FieldError[]) {
  return {
    message: "Refused",
    extensions: fieldErrors ? { code, fieldErrors } : { code },
  };
}

function failure(...errors: ReturnType<typeof refused>[]): CombinedGraphQLErrors {
  return new CombinedGraphQLErrors({ errors });
}

const fieldError = (field: string, reasons?: string[]): FieldError => ({
  field,
  messages: ["bad"],
  ...(reasons ? { reasons } : {}),
});

describe("useCvProjectForm", () => {
  it.each([
    ["NOT_FOUND", "notFound", "This CV does not exist any more."],
    ["BAD_USER_INPUT", "invalid", "The server did not accept these values."],
    ["FORBIDDEN", "forbidden", "You are not allowed to change this CV."],
    [
      "CONFLICT",
      "conflict",
      "This project is already in the CV, or its dates changed. Please try again.",
    ],
  ] as const)("shows the own text of the code %s as the error", (code, key, expected) => {
    const { result, t } = setup();

    act(() => result().showError(failure(refused(code))));

    expect(t()(key)).toBe(expected);
    expect(result().error).toBe(expected);
  });

  it.each([
    ["an unknown code", failure(refused("INTERNAL_SERVER_ERROR"))],
    ["a network error", new Error("Failed to fetch")],
  ])("shows the failed text for %s", (_name, error) => {
    const { result, t } = setup();

    act(() => result().showError(error));

    expect(t()("failed")).toBe("Something went wrong. Please try again later");
    expect(result().error).toBe("Something went wrong. Please try again later");
  });

  it.each([
    ["projectId", "server.projectId", "This project cannot be added to the CV"],
    ["roleIds", "server.roleIds", "At least one valid role must be selected"],
    ["responsibilities", "server.responsibilities", "The server did not accept this value"],
    ["startDate", "server.startDate", "Start date must be within project duration"],
    ["endDate", "server.endDate", "End date must be within project duration"],
  ] as const)(
    "shows the text of the field %s under it and no general error",
    (field, key, text) => {
      const { result, t } = setup();

      act(() => result().showError(failure(refused("BAD_USER_INPUT", [fieldError(field)]))));

      expect(t()(key)).toBe(text);
      expect(result().form.getFieldState(field).error).toMatchObject({
        type: "server",
        message: text,
      });
      expect(result().error).toBeUndefined();
    },
  );

  it("shows the date texts of the reasons under the date fields", () => {
    const { result } = setup();

    act(() =>
      result().showError(
        failure(
          refused("BAD_USER_INPUT", [
            fieldError("startDate", ["START_OUTSIDE_PROJECT"]),
            fieldError("endDate", ["END_BEFORE_START"]),
          ]),
        ),
      ),
    );

    expect(result().form.getFieldState("startDate").error?.message).toBe(
      "Start date must be within project duration",
    );
    expect(result().form.getFieldState("endDate").error?.message).toBe(
      "End date cannot be earlier than start date",
    );
    expect(result().error).toBeUndefined();
  });

  it("shows the field error and no general error when a conflict comes with a known field", () => {
    const { result } = setup();

    act(() =>
      result().showError(
        failure(
          refused("BAD_USER_INPUT", [fieldError("startDate", ["START_OUTSIDE_PROJECT"])]),
          refused("CONFLICT"),
        ),
      ),
    );

    expect(result().form.getFieldState("startDate").error).toMatchObject({ type: "server" });
    expect(result().error).toBeUndefined();
  });

  it("shows the conflict text when a field error has no field in the form", () => {
    const { result } = setup();

    act(() =>
      result().showError(
        failure(refused("BAD_USER_INPUT", [fieldError("other")]), refused("CONFLICT")),
      ),
    );

    expect(result().error).toBe(
      "This project is already in the CV, or its dates changed. Please try again.",
    );
  });

  it("clears the error on reset", () => {
    const { result } = setup();
    act(() => result().showError(new Error("Failed to fetch")));
    expect(result().error).toBeDefined();

    act(() => result().reset(result().form.getValues()));

    expect(result().error).toBeUndefined();
  });
});
