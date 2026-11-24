import { screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button } from "@/shared/components";
import type { UpdateUserInput } from "@/shared/graphql";
import { renderWithProviders, type RenderWithProvidersOptions } from "@/shared/testing";
import {
  alpha,
  bravo,
  departmentOptionsMock,
  departments,
  positionOptionsMock,
  positions,
  updateUserMock,
  updateUserNetworkErrorMock,
  updateUserRefusedMock,
} from "../../users.mocks";
import type { UserListItem } from "../../users.types";
import { useUpdateUserForm } from "../../useUpdateUserForm";
import { UpdateUserModal } from "./UpdateUserModal";

// The signed-in admin in these tests.
const currentUserId = alpha.id;

// The page owns the hook; this small page opens the modal for one row the same way.
function Harness({ row }: { row: UserListItem }) {
  const editing = useUpdateUserForm();
  return (
    <>
      <Button onClick={() => editing.open(row)}>Open</Button>
      <UpdateUserModal editing={editing} currentUserId={currentUserId} />
    </>
  );
}

const departmentItems = [departments.dotNet, departments.java, departments.react];
const positionItems = [positions.dataAnalyst, positions.softwareEngineer];

// Bravo gets the Java department; everything else stays.
const input: UpdateUserInput = {
  id: bravo.id,
  firstName: "Bravo",
  lastName: "Tango",
  departmentId: departments.java.id,
  positionId: positions.dataAnalyst.id,
  role: "USER",
};

async function open(row: UserListItem = bravo, options: RenderWithProvidersOptions = {}) {
  // Each opening asks the backend for the departments and positions, so each test answers both.
  const view = renderWithProviders(<Harness row={row} />, {
    ...options,
    mocks: [
      departmentOptionsMock(departmentItems),
      positionOptionsMock(positionItems),
      ...(options.mocks ?? []),
    ],
  });
  await view.user.click(screen.getByRole("button", { name: "Open" }));
  const dialog = await screen.findByRole("dialog", { name: "Update user" });
  // The selects show the user's department and position once their options are there.
  await waitFor(() =>
    expect(within(dialog).getByRole("combobox", { name: "Department" })).toBeEnabled(),
  );
  await waitFor(() =>
    expect(within(dialog).getByRole("combobox", { name: "Position" })).toBeEnabled(),
  );
  return { ...view, dialog };
}

async function chooseJava({ user, dialog }: Awaited<ReturnType<typeof open>>) {
  await user.click(within(dialog).getByRole("combobox", { name: "Department" }));
  await user.click(await screen.findByRole("option", { name: "Java" }));
}

describe("UpdateUserModal", () => {
  it("opens with the user's data and a disabled UPDATE button", async () => {
    const { dialog } = await open();

    expect(within(dialog).getByRole("textbox", { name: "First Name" })).toHaveValue("Bravo");
    expect(within(dialog).getByRole("textbox", { name: "Last Name" })).toHaveValue("Tango");
    expect(within(dialog).getByRole("combobox", { name: "Department" })).toHaveTextContent(".NET");
    expect(within(dialog).getByRole("combobox", { name: "Position" })).toHaveTextContent(
      "Data Analyst",
    );
    expect(within(dialog).getByRole("combobox", { name: "Role" })).toHaveTextContent("Employee");
    expect(within(dialog).getByRole("button", { name: "Update" })).toBeDisabled();
  });

  it("shows Email with the user's email and an empty Password, both disabled", async () => {
    const { dialog } = await open();

    const email = within(dialog).getByRole("textbox", { name: "Email" });
    expect(email).toHaveValue(bravo.email);
    expect(email).toBeDisabled();
    const password = within(dialog).getByLabelText("Password");
    expect(password).toHaveValue("");
    expect(password).toBeDisabled();
  });

  it("lets the admin change another user's role", async () => {
    const { dialog } = await open();

    expect(within(dialog).getByRole("combobox", { name: "Role" })).toBeEnabled();
    expect(within(dialog).queryByText("You cannot change your own role")).not.toBeInTheDocument();
  });

  it("disables Role on the admin's own row and says why", async () => {
    const { dialog } = await open(alpha);

    const role = within(dialog).getByRole("combobox", { name: "Role" });
    expect(role).toBeDisabled();
    expect(role).toHaveAccessibleDescription("You cannot change your own role");
  });

  it("enables UPDATE after a change, sends it, closes and shows a success toast", async () => {
    const view = await open(bravo, { mocks: [updateUserMock(input, bravo.email)] });
    await chooseJava(view);

    await view.user.click(within(view.dialog).getByRole("button", { name: "Update" }));

    expect(await screen.findByText("User updated")).toBeInTheDocument();
    expect(screen.queryByRole("dialog", { name: "Update user" })).not.toBeInTheDocument();
  });

  it("shows a required name after it was cleared, and keeps UPDATE disabled", async () => {
    const { user, dialog } = await open();

    await user.clear(within(dialog).getByRole("textbox", { name: "First Name" }));
    await user.tab();

    expect(await within(dialog).findByText("First name is required")).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "Update" })).toBeDisabled();
  });

  it("shows 'no longer exists' when the user was deleted meanwhile", async () => {
    const view = await open(bravo, {
      mocks: [updateUserRefusedMock(input, { code: "NOT_FOUND" })],
    });
    await chooseJava(view);

    await view.user.click(within(view.dialog).getByRole("button", { name: "Update" }));

    expect(await within(view.dialog).findByRole("alert")).toHaveTextContent(
      "This user no longer exists.",
    );
  });

  it("keeps the values and shows a message when the request fails", async () => {
    const view = await open(bravo, { mocks: [updateUserNetworkErrorMock(input)] });
    await chooseJava(view);

    await view.user.click(within(view.dialog).getByRole("button", { name: "Update" }));

    expect(await within(view.dialog).findByRole("alert")).toHaveTextContent(
      "Something went wrong. Try again.",
    );
    expect(within(view.dialog).getByRole("combobox", { name: "Department" })).toHaveTextContent(
      "Java",
    );
  });

  it("closes without a request on CANCEL", async () => {
    // No update mock: a request would fail the test with the general error.
    const view = await open();
    await chooseJava(view);

    await view.user.click(within(view.dialog).getByRole("button", { name: "Cancel" }));

    expect(screen.queryByRole("dialog", { name: "Update user" })).not.toBeInTheDocument();
  });
});
