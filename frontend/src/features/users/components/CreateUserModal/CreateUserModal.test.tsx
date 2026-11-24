import { screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button } from "@/shared/components";
import type { CreateUserInput } from "@/shared/graphql";
import { renderWithProviders, type RenderWithProvidersOptions } from "@/shared/testing";
import { useCreateUserForm } from "../../useCreateUserForm";
import {
  createUserMock,
  createUserNetworkErrorMock,
  createUserRefusedMock,
  departmentOptionsErrorMock,
  departmentOptionsMock,
  departments,
  positionOptionsMock,
  positions,
} from "../../users.mocks";
import { CreateUserModal } from "./CreateUserModal";

// The page owns the hook; this small page opens the modal the same way.
function Harness() {
  const creation = useCreateUserForm();
  return (
    <>
      <Button onClick={creation.open}>Open</Button>
      <CreateUserModal creation={creation} />
    </>
  );
}

const departmentItems = [departments.dotNet, departments.react];
const positionItems = [positions.dataAnalyst, positions.softwareEngineer];

const input: CreateUserInput = {
  email: "new.user@example.com",
  password: "secret123",
  firstName: "Ada",
  lastName: "Lovelace",
  departmentId: departments.react.id,
  positionId: positions.softwareEngineer.id,
  role: "USER",
};

type OpenOptions = RenderWithProvidersOptions & {
  /** The Department options answer. Default: two departments. */
  departmentsMock?: ReturnType<typeof departmentOptionsMock>;
};

async function open({ departmentsMock, ...options }: OpenOptions = {}) {
  // Each opening asks the backend for the departments and positions, so each test answers both.
  const view = renderWithProviders(<Harness />, {
    ...options,
    // The answers of the first opening come first; the test mocks after them answer later requests (a retry).
    mocks: [
      departmentsMock ?? departmentOptionsMock(departmentItems),
      positionOptionsMock(positionItems),
      ...(options.mocks ?? []),
    ],
  });
  await view.user.click(screen.getByRole("button", { name: "Open" }));
  const dialog = await screen.findByRole("dialog", { name: "Create user" });
  return { ...view, dialog };
}

// The select is disabled while its options load; wait until it can be used.
async function enabledSelect(dialog: HTMLElement, name: string) {
  const select = within(dialog).getByRole("combobox", { name });
  await waitFor(() => expect(select).toBeEnabled());
  return select;
}

async function fill({ user, dialog }: Awaited<ReturnType<typeof open>>) {
  await user.type(within(dialog).getByRole("textbox", { name: "Email" }), input.email);
  await user.type(within(dialog).getByLabelText("Password"), input.password);
  await user.type(within(dialog).getByRole("textbox", { name: "First Name" }), input.firstName);
  await user.type(within(dialog).getByRole("textbox", { name: "Last Name" }), input.lastName);
  await user.click(await enabledSelect(dialog, "Department"));
  await user.click(await screen.findByRole("option", { name: "React" }));
  await user.click(await enabledSelect(dialog, "Position"));
  await user.click(await screen.findByRole("option", { name: "Software Engineer" }));
}

describe("CreateUserModal", () => {
  it("opens with empty fields, Role set to Employee and a disabled CREATE button", async () => {
    const { dialog } = await open();

    for (const name of ["Email", "First Name", "Last Name"]) {
      expect(within(dialog).getByRole("textbox", { name })).toHaveValue("");
    }
    expect(within(dialog).getByLabelText("Password")).toHaveValue("");
    expect(within(dialog).getByRole("combobox", { name: "Role" })).toHaveTextContent("Employee");
    expect(within(dialog).getByRole("button", { name: "Create" })).toBeDisabled();
  });

  it("masks the password and shows it with the eye button", async () => {
    const { user, dialog } = await open();
    const password = within(dialog).getByLabelText("Password");

    expect(password).toHaveAttribute("type", "password");
    await user.click(within(dialog).getByRole("button", { name: "Show password" }));
    expect(password).toHaveAttribute("type", "text");
  });

  it("lists the departments and positions of the backend, by name", async () => {
    const { user, dialog } = await open();

    await user.click(await enabledSelect(dialog, "Department"));
    expect((await screen.findAllByRole("option")).map((option) => option.textContent)).toEqual([
      ".NET",
      "React",
    ]);
    await user.keyboard("{Escape}");

    await user.click(await enabledSelect(dialog, "Position"));
    expect((await screen.findAllByRole("option")).map((option) => option.textContent)).toEqual([
      "Data Analyst",
      "Software Engineer",
    ]);
  });

  it("disables Department while its options load", async () => {
    // A delayed answer keeps the request pending, so a slow machine cannot finish loading before the check.
    const { dialog } = await open({
      departmentsMock: { ...departmentOptionsMock(departmentItems), delay: 10_000 },
    });

    expect(within(dialog).getByRole("combobox", { name: "Department" })).toBeDisabled();
    expect(within(dialog).getByText("Loading…")).toBeInTheDocument();
  });

  it("shows an error and Retry when the departments fail, and Retry loads them", async () => {
    const { user, dialog } = await open({
      departmentsMock: departmentOptionsErrorMock(),
      mocks: [departmentOptionsMock(departmentItems)],
    });

    expect(await within(dialog).findByText("Failed to load departments")).toBeInTheDocument();
    expect(within(dialog).getByRole("combobox", { name: "Department" })).toBeDisabled();
    await user.click(within(dialog).getByRole("button", { name: "Retry" }));

    await enabledSelect(dialog, "Department");
    expect(within(dialog).queryByText("Failed to load departments")).not.toBeInTheDocument();
  });

  it("shows the required and rule messages after the fields were left", async () => {
    const { user, dialog } = await open();

    await user.click(within(dialog).getByRole("textbox", { name: "Email" }));
    await user.tab();
    expect(await within(dialog).findByText("Email is required")).toBeInTheDocument();

    await user.type(within(dialog).getByLabelText("Password"), "abcdefgh");
    await user.tab();
    expect(
      await within(dialog).findByText("Password must contain at least one letter and one digit"),
    ).toBeInTheDocument();
  });

  it("sends the values, closes the modal and shows a success toast", async () => {
    const view = await open({ mocks: [createUserMock(input)] });
    await fill(view);

    await view.user.click(within(view.dialog).getByRole("button", { name: "Create" }));

    expect(await screen.findByText("User created")).toBeInTheDocument();
    expect(screen.queryByRole("dialog", { name: "Create user" })).not.toBeInTheDocument();
  });

  it("sends the Admin role when the admin picks it", async () => {
    const view = await open({ mocks: [createUserMock({ ...input, role: "ADMIN" })] });
    await fill(view);
    await view.user.click(within(view.dialog).getByRole("combobox", { name: "Role" }));
    await view.user.click(await screen.findByRole("option", { name: "Admin" }));

    await view.user.click(within(view.dialog).getByRole("button", { name: "Create" }));

    // The mock matches only this exact input.
    expect(await screen.findByText("User created")).toBeInTheDocument();
  });

  it("shows a taken email under Email and keeps the values", async () => {
    const view = await open({
      mocks: [createUserRefusedMock(input, { code: "CONFLICT", reason: "EMAIL_TAKEN" })],
    });
    await fill(view);

    await view.user.click(within(view.dialog).getByRole("button", { name: "Create" }));

    expect(
      await within(view.dialog).findByText("A user with this email already exists"),
    ).toBeInTheDocument();
    expect(within(view.dialog).getByRole("textbox", { name: "Email" })).toHaveValue(input.email);
    expect(within(view.dialog).getByRole("textbox", { name: "First Name" })).toHaveValue("Ada");
  });

  it("shows the permission message on FORBIDDEN", async () => {
    const view = await open({ mocks: [createUserRefusedMock(input, { code: "FORBIDDEN" })] });
    await fill(view);

    await view.user.click(within(view.dialog).getByRole("button", { name: "Create" }));

    expect(await within(view.dialog).findByRole("alert")).toHaveTextContent(
      "You do not have permission to do this.",
    );
  });

  it("keeps the values and shows a message when the request fails", async () => {
    const view = await open({ mocks: [createUserNetworkErrorMock(input)] });
    await fill(view);

    await view.user.click(within(view.dialog).getByRole("button", { name: "Create" }));

    expect(await within(view.dialog).findByRole("alert")).toHaveTextContent(
      "Something went wrong. Try again.",
    );
    expect(within(view.dialog).getByLabelText("Password")).toHaveValue(input.password);
  });

  it("closes without a request on CANCEL", async () => {
    // No create mock: a request would fail the test with the general error.
    const { user, dialog } = await open();
    await user.type(within(dialog).getByRole("textbox", { name: "Email" }), input.email);

    await user.click(within(dialog).getByRole("button", { name: "Cancel" }));

    expect(screen.queryByRole("dialog", { name: "Create user" })).not.toBeInTheDocument();
  });
});
