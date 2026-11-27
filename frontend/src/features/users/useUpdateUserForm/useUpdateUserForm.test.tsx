import { act, screen } from "@testing-library/react";
import type { BaseSyntheticEvent, ReactNode } from "react";
import { describe, expect, it } from "vitest";
import type { UpdateUserInput } from "@/shared/graphql";
import { renderWithProviders, type RenderWithProvidersOptions } from "@/shared/testing";
import {
  bravo,
  departments,
  emailOnly,
  positions,
  updateUserMock,
  updateUserNetworkErrorMock,
  updateUserRefusedMock,
  withErrors,
} from "../users.mocks";
import { useUpdateUserForm } from "./useUpdateUserForm";

// Bravo moves to the Java department and gets a new last name.
const input: UpdateUserInput = {
  id: bravo.id,
  firstName: "Bravo",
  lastName: "Victor",
  departmentId: departments.java.id,
  positionId: positions.dataAnalyst.id,
  role: "USER",
};

// The submit handler only needs these two methods of the form event.
const fakeEvent = {
  preventDefault: () => undefined,
  persist: () => undefined,
} as unknown as BaseSyntheticEvent;

// renderWithProviders renders elements; this small component lets the hook run inside the same providers.
function setup(options: RenderWithProvidersOptions = {}) {
  let current!: ReturnType<typeof useUpdateUserForm>;
  function Probe(): ReactNode {
    current = useUpdateUserForm();
    return null;
  }
  renderWithProviders(<Probe />, options);
  return { result: () => current };
}

// Opens the modal for Bravo and makes the changes of `input`, with spaces the rules trim.
function openAndChange(result: () => ReturnType<typeof useUpdateUserForm>) {
  act(() => {
    result().open(bravo);
    const { setValue } = result().form;
    setValue("lastName", " Victor ", { shouldDirty: true });
    setValue("departmentId", departments.java.id, { shouldDirty: true });
  });
}

async function submit(result: () => ReturnType<typeof useUpdateUserForm>) {
  await act(() => result().submit(fakeEvent));
}

describe("useUpdateUserForm", () => {
  it("opens with the user's data and no password", () => {
    const { result } = setup();
    act(() => result().open(bravo));

    expect(result().isOpen).toBe(true);
    expect(result().user).toBe(bravo);
    expect(result().form.getValues()).toEqual({
      email: bravo.email,
      password: "",
      firstName: "Bravo",
      lastName: "Tango",
      departmentId: bravo.department?.id,
      positionId: bravo.position?.id,
      role: "USER",
    });
    expect(result().form.formState.isDirty).toBe(false);
  });

  it("opens with empty fields for what a signed-up user never filled", () => {
    const { result } = setup();
    act(() => result().open(emailOnly));

    expect(result().form.getValues()).toMatchObject({
      firstName: "",
      lastName: "",
      departmentId: "",
      positionId: "",
    });
  });

  it("sends the trimmed values without email and password, closes and shows a toast", async () => {
    // The mock matches only this exact input: an email or a password in it would find no mock.
    const { result } = setup({ mocks: [updateUserMock(input, bravo.email)] });
    openAndChange(result);
    await submit(result);

    expect(result().isOpen).toBe(false);
    expect(result().generalError).toBeNull();
    expect(await screen.findByText("User updated")).toBeInTheDocument();
    expect(screen.getByText("The data of Bravo Victor was saved.")).toBeInTheDocument();
  });

  it("shows OWN_ROLE as its own message and keeps the values", async () => {
    const { result } = setup({
      mocks: [updateUserRefusedMock(input, { code: "CONFLICT", reason: "OWN_ROLE" })],
    });
    openAndChange(result);
    await submit(result);

    expect(result().isOpen).toBe(true);
    expect(result().generalError).toBe("ownRole");
    expect(result().form.getValues("lastName")).toBe(" Victor ");
  });

  it("shows CONCURRENT_CHANGE as its own message and keeps the values", async () => {
    const { result } = setup({
      mocks: [updateUserRefusedMock(input, { code: "CONFLICT", reason: "CONCURRENT_CHANGE" })],
    });
    openAndChange(result);
    await submit(result);

    expect(result().isOpen).toBe(true);
    expect(result().generalError).toBe("concurrentChange");
    expect(result().form.getValues("lastName")).toBe(" Victor ");
  });

  it("shows NOT_FOUND as 'no longer exists'", async () => {
    const { result } = setup({ mocks: [updateUserRefusedMock(input, { code: "NOT_FOUND" })] });
    openAndChange(result);
    await submit(result);

    expect(result().generalError).toBe("notFound");
  });

  it("shows NOT_FOUND when it is not the first error of the response", async () => {
    const { result } = setup({
      mocks: [
        withErrors(updateUserMock(input), [
          { code: "CONFLICT", reason: "OWN_ROLE" },
          { code: "NOT_FOUND" },
        ]),
      ],
    });
    openAndChange(result);
    await submit(result);

    expect(result().generalError).toBe("notFound");
  });

  it("shows a BAD_USER_INPUT field error under its field", async () => {
    const { result } = setup({
      mocks: [
        updateUserRefusedMock(input, {
          code: "BAD_USER_INPUT",
          fieldErrors: [{ field: "departmentId", messages: ["Department not found"] }],
        }),
      ],
    });
    openAndChange(result);
    await submit(result);

    expect(result().form.getFieldState("departmentId").error?.message).toBe("Check this field");
    expect(result().generalError).toBeNull();
  });

  it("shows FORBIDDEN as the permission message", async () => {
    const { result } = setup({ mocks: [updateUserRefusedMock(input, { code: "FORBIDDEN" })] });
    openAndChange(result);
    await submit(result);

    expect(result().generalError).toBe("forbidden");
  });

  it("shows any other failure as the general message, and opening again clears it", async () => {
    const { result } = setup({ mocks: [updateUserNetworkErrorMock(input)] });
    openAndChange(result);
    await submit(result);

    expect(result().isOpen).toBe(true);
    expect(result().generalError).toBe("failed");

    act(() => result().open(bravo));
    expect(result().generalError).toBeNull();
    expect(result().form.getValues("lastName")).toBe("Tango");
  });
});
