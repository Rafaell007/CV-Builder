import { act, screen } from "@testing-library/react";
import type { BaseSyntheticEvent, ReactNode } from "react";
import { describe, expect, it } from "vitest";
import type { CreateUserInput } from "@/shared/graphql";
import { renderWithProviders, type RenderWithProvidersOptions } from "@/shared/testing";
import {
  createUserMock,
  createUserNetworkErrorMock,
  createUserRefusedMock,
  departments,
  positions,
} from "../users.mocks";
import { useCreateUserForm } from "./useCreateUserForm";

const input: CreateUserInput = {
  email: "new.user@example.com",
  password: "secret123",
  firstName: "Ada",
  lastName: "Lovelace",
  departmentId: departments.react.id,
  positionId: positions.softwareEngineer.id,
  role: "USER",
};

// The submit handler only needs these two methods of the form event.
const fakeEvent = {
  preventDefault: () => undefined,
  persist: () => undefined,
} as unknown as BaseSyntheticEvent;

// renderWithProviders renders elements; this small component lets the hook run inside the same providers.
function setup(options: RenderWithProvidersOptions = {}) {
  let current!: ReturnType<typeof useCreateUserForm>;
  function Probe(): ReactNode {
    current = useCreateUserForm();
    return null;
  }
  renderWithProviders(<Probe />, options);
  return { result: () => current };
}

// Opens the modal and types `input`, with spaces around the texts the rules trim.
function openAndFill(result: () => ReturnType<typeof useCreateUserForm>) {
  act(() => {
    result().open();
    const { setValue } = result().form;
    setValue("email", ` ${input.email} `);
    setValue("password", input.password);
    setValue("firstName", ` ${input.firstName}`);
    setValue("lastName", input.lastName);
    setValue("departmentId", departments.react.id);
    setValue("positionId", positions.softwareEngineer.id);
  });
}

async function submit(result: () => ReturnType<typeof useCreateUserForm>) {
  await act(() => result().submit(fakeEvent));
}

describe("useCreateUserForm", () => {
  it("opens empty, with Role set to Employee", () => {
    const { result } = setup();
    act(() => result().open());

    expect(result().isOpen).toBe(true);
    expect(result().form.getValues()).toEqual({
      email: "",
      password: "",
      firstName: "",
      lastName: "",
      departmentId: "",
      positionId: "",
      role: "USER",
    });
  });

  it("sends the trimmed values, closes and shows a toast with the name", async () => {
    const { result } = setup({ mocks: [createUserMock(input)] });
    openAndFill(result);
    await submit(result);

    expect(result().isOpen).toBe(false);
    expect(result().generalError).toBeNull();
    expect(await screen.findByText("User created")).toBeInTheDocument();
    expect(screen.getByText("Ada Lovelace was added to the employees.")).toBeInTheDocument();
  });

  it("shows a taken email under Email and keeps the values", async () => {
    const { result } = setup({
      mocks: [createUserRefusedMock(input, { code: "CONFLICT", reason: "EMAIL_TAKEN" })],
    });
    openAndFill(result);
    await submit(result);

    expect(result().isOpen).toBe(true);
    expect(result().form.getFieldState("email").error?.message).toBe(
      "A user with this email already exists",
    );
    expect(result().generalError).toBeNull();
    expect(result().form.getValues("password")).toBe(input.password);
  });

  it("shows a BAD_USER_INPUT field error under its field", async () => {
    const { result } = setup({
      mocks: [
        createUserRefusedMock(input, {
          code: "BAD_USER_INPUT",
          fieldErrors: [{ field: "firstName", messages: ["firstName is too long"] }],
        }),
      ],
    });
    openAndFill(result);
    await submit(result);

    expect(result().form.getFieldState("firstName").error?.message).toBe("Check this field");
    expect(result().generalError).toBeNull();
  });

  it("shows FORBIDDEN as the permission message", async () => {
    const { result } = setup({ mocks: [createUserRefusedMock(input, { code: "FORBIDDEN" })] });
    openAndFill(result);
    await submit(result);

    expect(result().isOpen).toBe(true);
    expect(result().generalError).toBe("forbidden");
  });

  it("shows any other failure as the general message and keeps the values", async () => {
    const { result } = setup({ mocks: [createUserNetworkErrorMock(input)] });
    openAndFill(result);
    await submit(result);

    expect(result().isOpen).toBe(true);
    expect(result().generalError).toBe("failed");
    expect(result().form.getValues("email")).toBe(` ${input.email} `);
  });

  it("clears the general error when the modal opens again", async () => {
    const { result } = setup({ mocks: [createUserNetworkErrorMock(input)] });
    openAndFill(result);
    await submit(result);
    act(() => result().open());

    expect(result().generalError).toBeNull();
    expect(result().form.getValues("email")).toBe("");
  });

  it("sends one request when submit is called twice in the same tick", async () => {
    // One create mock: a second request would find no mock and the modal would show the general error.
    const { result } = setup({ mocks: [{ ...createUserMock(input), delay: 20 }] });
    openAndFill(result);

    await act(async () => {
      await Promise.all([result().submit(fakeEvent), result().submit(fakeEvent)]);
    });

    expect(result().generalError).toBeNull();
    expect(result().isOpen).toBe(false);
  });
});
