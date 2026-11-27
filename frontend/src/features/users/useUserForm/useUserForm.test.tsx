import { CombinedGraphQLErrors } from "@apollo/client";
import { act } from "@testing-library/react";
import type { BaseSyntheticEvent, ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { renderWithProviders } from "@/shared/testing";
import { useUserForm } from "./useUserForm";

type Values = { email: string; name: string };

const schema = z.object({ email: z.string(), name: z.string().min(1) });
const defaultValues: Values = { email: "ann@example.com", name: "Ann" };

// The submit handler only needs these two methods of the form event.
const fakeEvent = {
  preventDefault: () => undefined,
  persist: () => undefined,
} as unknown as BaseSyntheticEvent;

// renderWithProviders renders elements; this small component lets the hook run inside the same providers.
function setup() {
  let current!: ReturnType<typeof useUserForm<Values, Values>>;
  function Probe(): ReactNode {
    current = useUserForm<Values, Values>({
      schema,
      defaultValues,
      serverFields: ["email", "name"],
    });
    return null;
  }
  renderWithProviders(<Probe />);
  return { result: () => current };
}

function refused(extensions: Record<string, unknown>): CombinedGraphQLErrors {
  return new CombinedGraphQLErrors({ errors: [{ message: "Refused", extensions }] });
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

describe("useUserForm", () => {
  describe("the guard against a second submit", () => {
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

    it("submits again after the first submit ended", async () => {
      const { result } = setup();
      const send = vi.fn().mockResolvedValue(undefined);

      await act(() => result().submit(fakeEvent, send));
      await act(() => result().submit(fakeEvent, send));

      expect(send).toHaveBeenCalledTimes(2);
    });

    it("submits again after send threw", async () => {
      const { result } = setup();
      const send = vi.fn().mockRejectedValueOnce(new Error("boom")).mockResolvedValue(undefined);

      await act(async () => {
        await result()
          .submit(fakeEvent, send)
          .catch(() => undefined);
      });
      await act(() => result().submit(fakeEvent, send));

      expect(send).toHaveBeenCalledTimes(2);
    });

    it("submits again after validation failed", async () => {
      const { result } = setup();
      const send = vi.fn().mockResolvedValue(undefined);

      act(() => result().form.setValue("name", ""));
      await act(() => result().submit(fakeEvent, send));
      expect(send).not.toHaveBeenCalled();

      act(() => result().form.setValue("name", "Ann"));
      await act(() => result().submit(fakeEvent, send));
      expect(send).toHaveBeenCalledTimes(1);
    });
  });

  describe("validation and the general error", () => {
    it("does not call send when validation fails", async () => {
      const { result } = setup();
      const send = vi.fn().mockResolvedValue(undefined);

      act(() => result().form.setValue("name", ""));
      await act(() => result().submit(fakeEvent, send));

      expect(send).not.toHaveBeenCalled();
      expect(result().form.getFieldState("name").error).toBeDefined();
    });

    it("sends the checked values", async () => {
      const { result } = setup();
      const send = vi.fn().mockResolvedValue(undefined);

      await act(() => result().submit(fakeEvent, send));

      expect(send).toHaveBeenCalledWith(defaultValues);
    });

    it("clears the general error at the start of a valid submit", async () => {
      const { result } = setup();
      act(() => result().showError(new Error("Failed to fetch")));
      expect(result().generalError).toBe("failed");

      const { send, finish } = pendingSend();
      let running!: Promise<void>;
      await act(async () => {
        running = result().submit(fakeEvent, send);
        await vi.waitFor(() => expect(send).toHaveBeenCalled());
      });

      // The request is still running, and the old error is already gone.
      expect(result().generalError).toBeNull();

      await act(async () => {
        finish();
        await running;
      });
    });

    it("keeps the general error when validation fails", async () => {
      const { result } = setup();
      act(() => result().showError(new Error("Failed to fetch")));

      act(() => result().form.setValue("name", ""));
      await act(() => result().submit(fakeEvent, vi.fn()));

      expect(result().generalError).toBe("failed");
    });
  });

  describe("showError", () => {
    it("shows CONFLICT with EMAIL_TAKEN under Email and clears the general error", () => {
      const { result } = setup();
      act(() => result().showError(new Error("Failed to fetch")));
      expect(result().generalError).toBe("failed");

      act(() => result().showError(refused({ code: "CONFLICT", reason: "EMAIL_TAKEN" })));

      expect(result().form.getFieldState("email").error).toMatchObject({
        type: "server",
        message: "A user with this email already exists",
      });
      expect(result().generalError).toBeNull();
    });

    it.each([
      ["FORBIDDEN", { code: "FORBIDDEN" }, "forbidden"],
      ["CONFLICT with OWN_ROLE", { code: "CONFLICT", reason: "OWN_ROLE" }, "ownRole"],
      ["NOT_FOUND", { code: "NOT_FOUND" }, "notFound"],
      [
        "CONFLICT with CONCURRENT_CHANGE",
        { code: "CONFLICT", reason: "CONCURRENT_CHANGE" },
        "concurrentChange",
      ],
      ["BAD_USER_INPUT on no known field", { code: "BAD_USER_INPUT" }, "failed"],
      [
        "BAD_USER_INPUT on a field the form does not have",
        { code: "BAD_USER_INPUT", fieldErrors: [{ field: "other", messages: ["bad"] }] },
        "failed",
      ],
      ["CONFLICT with an unknown reason", { code: "CONFLICT", reason: "OTHER" }, "failed"],
      ["an unknown code", { code: "SOMETHING_ELSE" }, "failed"],
    ] as const)("shows %s as the general error %s", (_name, extensions, expected) => {
      const { result } = setup();

      act(() => result().showError(refused({ ...extensions })));

      expect(result().generalError).toBe(expected);
      expect(result().form.getFieldState("email").error).toBeUndefined();
    });

    it("shows a network error as the general error failed", () => {
      const { result } = setup();

      act(() => result().showError(new Error("Failed to fetch")));

      expect(result().generalError).toBe("failed");
    });

    it("shows BAD_USER_INPUT of a server field under that field and keeps the general error empty", () => {
      const { result } = setup();

      act(() =>
        result().showError(
          refused({
            code: "BAD_USER_INPUT",
            fieldErrors: [{ field: "name", messages: ["too long"] }],
          }),
        ),
      );

      expect(result().form.getFieldState("name").error).toMatchObject({
        type: "server",
        message: "Check this field",
      });
      expect(result().generalError).toBeNull();
    });
  });

  describe("reset and typed values", () => {
    it("fills the form with the values and clears the general error", () => {
      const { result } = setup();
      act(() => result().showError(refused({ code: "FORBIDDEN" })));
      expect(result().generalError).toBe("forbidden");

      act(() => result().reset({ email: "bob@example.com", name: "Bob" }));

      expect(result().form.getValues()).toEqual({ email: "bob@example.com", name: "Bob" });
      expect(result().form.formState.isDirty).toBe(false);
      expect(result().generalError).toBeNull();
    });

    it("keeps the typed values after a failed request", async () => {
      const { result } = setup();
      act(() => result().form.setValue("name", "Typed name"));

      await act(() =>
        result().submit(fakeEvent, async () => {
          result().showError(refused({ code: "FORBIDDEN" }));
        }),
      );

      expect(result().generalError).toBe("forbidden");
      expect(result().form.getValues("name")).toBe("Typed name");
    });
  });
});
