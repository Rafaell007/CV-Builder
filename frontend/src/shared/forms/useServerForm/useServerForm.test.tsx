import { CombinedGraphQLErrors } from "@apollo/client";
import { act } from "@testing-library/react";
import type { BaseSyntheticEvent, ReactNode } from "react";
import type { UseFormSetError } from "react-hook-form";
import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { renderWithProviders } from "@/shared/testing";
import { placeServerError, useServerForm, type UseServerFormOptions } from "./useServerForm";

type Values = { email: string; name: string };
type Extra = "forbidden";

const schema = z.object({ email: z.string(), name: z.string().min(1) });
const defaultValues: Values = { email: "ann@example.com", name: "Ann" };
const serverFields = {
  fields: ["email", "name"],
  getMessage: (field: string) => `${field} is invalid`,
} as const;

const fakeEvent = {
  preventDefault: () => undefined,
  persist: () => undefined,
} as unknown as BaseSyntheticEvent;

function graphQlError(...extensionsList: Record<string, unknown>[]): CombinedGraphQLErrors {
  return new CombinedGraphQLErrors({
    errors: extensionsList.map((extensions) => ({ message: "Refused", extensions })),
  });
}

const badUserInput = (field: string) => ({
  code: "BAD_USER_INPUT",
  fieldErrors: [{ field, messages: ["bad"] }],
});

const options: UseServerFormOptions<Values, Extra> = {
  defaultValues,
  serverFields,
  placeFailure: ({ kind, reason }) => {
    if (kind === "conflict" && reason === "EMAIL_TAKEN")
      return { show: "field", field: "email", message: "Email is taken" };
    if (kind === "forbidden") return { show: "general", error: "forbidden" };
    return { show: "fieldErrors", otherwise: "failed" };
  },
};

describe("placeServerError", () => {
  const setup = () => {
    const setError = vi.fn() as unknown as UseFormSetError<Values>;
    return { setError, place: (error: unknown) => placeServerError(error, setError, options) };
  };

  it("puts a field placement under its field with the focus and clears the general error", () => {
    const { setError, place } = setup();

    expect(place(graphQlError({ code: "CONFLICT", reason: "EMAIL_TAKEN" }))).toBeNull();
    expect(setError).toHaveBeenCalledWith(
      "email",
      { type: "server", message: "Email is taken" },
      { shouldFocus: true },
    );
  });

  it("returns the general error of a general placement and applies no field error", () => {
    const { setError, place } = setup();

    expect(place(graphQlError({ code: "FORBIDDEN" }))).toBe("forbidden");
    expect(setError).not.toHaveBeenCalled();
  });

  it("does not apply the field errors of a response that has a general placement", () => {
    const { setError, place } = setup();

    expect(place(graphQlError(badUserInput("name"), { code: "FORBIDDEN" }))).toBe("forbidden");
    expect(setError).not.toHaveBeenCalled();
  });

  it("does not apply the field errors of a response that has a field placement", () => {
    const { setError, place } = setup();

    expect(
      place(graphQlError(badUserInput("name"), { code: "CONFLICT", reason: "EMAIL_TAKEN" })),
    ).toBeNull();
    expect(setError).toHaveBeenCalledTimes(1);
    expect(setError).toHaveBeenCalledWith("email", expect.anything(), expect.anything());
  });

  it("applies the field errors and clears the general error when every one has its field", () => {
    const { setError, place } = setup();

    expect(place(graphQlError(badUserInput("name")))).toBeNull();
    expect(setError).toHaveBeenCalledWith(
      "name",
      { type: "server", message: "name is invalid" },
      { shouldFocus: true },
    );
  });

  it("shows failed when a field error has no field in the form, or there is none", () => {
    const { place } = setup();

    expect(place(graphQlError(badUserInput("phone")))).toBe("failed");
    expect(place(graphQlError({ code: "INTERNAL_SERVER_ERROR" }))).toBe("failed");
    expect(place(new Error("Failed to fetch"))).toBe("failed");
  });

  it("without placeFailure applies the field errors and shows failed for anything else", () => {
    const setError = vi.fn() as unknown as UseFormSetError<Values>;
    const place = (error: unknown) => placeServerError(error, setError, { serverFields });

    expect(place(graphQlError(badUserInput("name")))).toBeNull();
    expect(place(graphQlError({ code: "FORBIDDEN" }))).toBe("failed");
    expect(place(new Error("Failed to fetch"))).toBe("failed");
  });
});

describe("useServerForm", () => {
  // renderWithProviders renders elements; this small component lets the hook run inside the same providers.
  function setup() {
    let current!: ReturnType<typeof useServerForm<Values, Values, Extra>>;
    function Probe(): ReactNode {
      current = useServerForm<Values, Values, Extra>(schema, options);
      return null;
    }
    renderWithProviders(<Probe />);
    return { result: () => current };
  }

  it("ignores a second submit during a running submit and accepts one after it ended", async () => {
    const { result } = setup();
    const resolvers: (() => void)[] = [];
    const send = vi.fn(() => new Promise<void>((resolve) => resolvers.push(resolve)));

    await act(async () => {
      const first = result().submit(fakeEvent, send);
      const second = result().submit(fakeEvent, send);
      await new Promise((resolve) => setTimeout(resolve, 50));
      resolvers.forEach((resolve) => resolve());
      await Promise.all([first, second]);
    });
    expect(send).toHaveBeenCalledTimes(1);

    send.mockResolvedValue(undefined);
    await act(() => result().submit(fakeEvent, send));
    expect(send).toHaveBeenCalledTimes(2);
  });

  it("shows an error that send throws as the general error and accepts the next submit", async () => {
    const { result } = setup();
    const send = vi.fn().mockRejectedValueOnce(new Error("boom")).mockResolvedValue(undefined);

    await act(() => result().submit(fakeEvent, send));
    expect(result().generalError).toBe("failed");

    await act(() => result().submit(fakeEvent, send));
    expect(send).toHaveBeenCalledTimes(2);
    expect(result().generalError).toBeNull();
  });

  it("places a GraphQL error that send throws where placeFailure says", async () => {
    const { result } = setup();
    const send = vi.fn().mockRejectedValue(graphQlError({ code: "FORBIDDEN" }));

    await act(() => result().submit(fakeEvent, send));

    expect(result().generalError).toBe("forbidden");
  });

  it("does not call send again while a send that will throw is still running", async () => {
    const { result } = setup();
    const rejecters: ((error: Error) => void)[] = [];
    const send = vi.fn(() => new Promise<void>((_, reject) => rejecters.push(reject)));

    await act(async () => {
      const first = result().submit(fakeEvent, send);
      const second = result().submit(fakeEvent, send);
      await new Promise((resolve) => setTimeout(resolve, 50));
      rejecters.forEach((reject) => reject(new Error("boom")));
      await Promise.all([first, second]);
    });

    expect(send).toHaveBeenCalledTimes(1);
    expect(result().generalError).toBe("failed");
  });

  it("keeps the general error when validation fails and clears it before send", async () => {
    const { result } = setup();
    act(() => result().showError(graphQlError({ code: "FORBIDDEN" })));
    expect(result().generalError).toBe("forbidden");

    act(() => result().form.setValue("name", ""));
    const send = vi.fn().mockResolvedValue(undefined);
    await act(() => result().submit(fakeEvent, send));
    expect(send).not.toHaveBeenCalled();
    expect(result().generalError).toBe("forbidden");

    act(() => result().form.setValue("name", "Ann"));
    await act(() => result().submit(fakeEvent, send));
    expect(send).toHaveBeenCalledWith(defaultValues);
    expect(result().generalError).toBeNull();
  });

  it("keeps the general error that send shows through showError", async () => {
    const { result } = setup();
    const send = vi.fn(async () => {
      result().showError(graphQlError({ code: "FORBIDDEN" }));
    });

    await act(() => result().submit(fakeEvent, send));

    expect(result().generalError).toBe("forbidden");
  });

  it("sets the general error that placeFailure gives and keeps the typed values", async () => {
    const { result } = setup();
    act(() => result().form.setValue("name", "Bob"));

    act(() => result().showError(graphQlError({ code: "FORBIDDEN" })));

    expect(result().generalError).toBe("forbidden");
    expect(result().form.getValues("name")).toBe("Bob");
  });

  it("reset fills the form, makes it unchanged and clears the general error", () => {
    const { result } = setup();
    act(() => result().showError(new Error("Failed to fetch")));
    expect(result().generalError).toBe("failed");

    act(() => result().reset({ email: "bob@example.com", name: "Bob" }));

    expect(result().generalError).toBeNull();
    expect(result().form.getValues()).toEqual({ email: "bob@example.com", name: "Bob" });
    expect(result().form.formState.isDirty).toBe(false);
  });
});
