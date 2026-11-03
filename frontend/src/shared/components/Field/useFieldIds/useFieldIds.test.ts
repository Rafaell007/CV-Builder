import { describe, expect, it } from "vitest";
import { renderHook } from "@/shared/testing";
import { useFieldIds } from "./useFieldIds";

describe("useFieldIds", () => {
  it("generates a unique control id when none is given", () => {
    const first = renderHook(() => useFieldIds({ hasHelperText: false, hasError: false }));
    const second = renderHook(() => useFieldIds({ hasHelperText: false, hasError: false }));

    expect(first.result.current.controlId).not.toBe("");
    expect(first.result.current.controlId).not.toBe(second.result.current.controlId);
  });

  it("builds the helper and error ids from a given id", () => {
    const { result } = renderHook(() =>
      useFieldIds({ id: "email", hasHelperText: false, hasError: false }),
    );

    expect(result.current).toMatchObject({
      controlId: "email",
      helperId: "email-helper",
      errorId: "email-error",
    });
  });

  it.each([
    { hasHelperText: false, hasError: false, invalid: undefined, describedBy: undefined },
    { hasHelperText: true, hasError: false, invalid: undefined, describedBy: "email-helper" },
    { hasHelperText: false, hasError: true, invalid: true, describedBy: "email-error" },
    // The error replaces the helper text, so only the error is announced.
    { hasHelperText: true, hasError: true, invalid: true, describedBy: "email-error" },
  ])(
    "helper $hasHelperText, error $hasError → aria-describedby $describedBy",
    ({ hasHelperText, hasError, invalid, describedBy }) => {
      const { result } = renderHook(() => useFieldIds({ id: "email", hasHelperText, hasError }));

      expect(result.current.controlProps).toEqual({
        id: "email",
        "aria-invalid": invalid,
        "aria-describedby": describedBy,
      });
    },
  );

  it("keeps the caller's aria-describedby after the helper or error id", () => {
    const { result } = renderHook(() =>
      useFieldIds({ id: "email", hasHelperText: false, hasError: true, ariaDescribedBy: "hint" }),
    );

    expect(result.current.controlProps["aria-describedby"]).toBe("email-error hint");
  });

  it("uses the caller's aria-describedby alone when there is no helper text or error", () => {
    const { result } = renderHook(() =>
      useFieldIds({ id: "email", hasHelperText: false, hasError: false, ariaDescribedBy: "hint" }),
    );

    expect(result.current.controlProps["aria-describedby"]).toBe("hint");
  });

  it("keeps the caller's aria-invalid when there is no error, and the error wins otherwise", () => {
    const withoutError = renderHook(() =>
      useFieldIds({ id: "email", hasHelperText: false, hasError: false, ariaInvalid: true }),
    );
    const withError = renderHook(() =>
      useFieldIds({ id: "email", hasHelperText: false, hasError: true, ariaInvalid: false }),
    );

    expect(withoutError.result.current.controlProps["aria-invalid"]).toBe(true);
    expect(withError.result.current.controlProps["aria-invalid"]).toBe(true);
  });
});
