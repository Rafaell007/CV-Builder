import { screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/shared/testing";
import type { CatalogItem } from "../../catalogs.types";
import { useCreateCatalogItemForm } from "../../useCreateCatalogItemForm";
import { useUpdateCatalogItemForm } from "../../useUpdateCatalogItemForm";
import { NameFormModal } from "./NameFormModal";

type Create = (name: string) => Promise<CatalogItem>;

// The modal takes the state of a real flow hook, so the test drives it like the pages do.
function CreateHarness({ create }: { create: Create }) {
  const creation = useCreateCatalogItemForm("catalogs.departments", create);
  return (
    <>
      <button type="button" onClick={creation.open}>
        Open
      </button>
      <NameFormModal namespace="catalogs.departments" kind="create" nameForm={creation} />
    </>
  );
}

function UpdateHarness({ update }: { update: (id: string, name: string) => Promise<CatalogItem> }) {
  const editing = useUpdateCatalogItemForm("catalogs.departments", update);
  return (
    <>
      <button type="button" onClick={() => editing.open({ id: "1", name: "Engineering" })}>
        Open
      </button>
      <NameFormModal namespace="catalogs.departments" kind="update" nameForm={editing} />
    </>
  );
}

async function openDialog(user: ReturnType<typeof renderWithProviders>["user"], name: string) {
  await user.click(screen.getByRole("button", { name: "Open" }));
  return screen.findByRole("dialog", { name });
}

describe("NameFormModal", () => {
  it("is closed until the flow opens it", () => {
    renderWithProviders(<CreateHarness create={vi.fn()} />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("create: shows an empty field, and Create waits for a name", async () => {
    const { user } = renderWithProviders(<CreateHarness create={vi.fn()} />);
    const dialog = await openDialog(user, "Create department");
    const field = within(dialog).getByRole("textbox", { name: "Department" });
    const submit = within(dialog).getByRole("button", { name: "Create" });

    expect(field).toHaveValue("");
    expect(submit).toBeDisabled();

    await user.type(field, "Design");
    await waitFor(() => expect(submit).toBeEnabled());
  });

  it("create: a name of spaces shows the required message and keeps Create disabled", async () => {
    const { user } = renderWithProviders(<CreateHarness create={vi.fn()} />);
    const dialog = await openDialog(user, "Create department");

    await user.type(within(dialog).getByRole("textbox", { name: "Department" }), "   ");
    await user.tab();

    expect(await within(dialog).findByText("Department name is required")).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "Create" })).toBeDisabled();
  });

  it("create: sends the trimmed name on Create and closes", async () => {
    const create = vi.fn().mockResolvedValue({ id: "9", name: "Design" });
    const { user } = renderWithProviders(<CreateHarness create={create} />);
    const dialog = await openDialog(user, "Create department");

    await user.type(within(dialog).getByRole("textbox", { name: "Department" }), " Design ");
    await user.click(within(dialog).getByRole("button", { name: "Create" }));

    expect(create).toHaveBeenCalledExactlyOnceWith("Design");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("create: shows the general error under the form and keeps the name when the request fails", async () => {
    const create = vi.fn().mockRejectedValue(new Error("Failed to fetch"));
    const { user } = renderWithProviders(<CreateHarness create={create} />);
    const dialog = await openDialog(user, "Create department");
    const field = within(dialog).getByRole("textbox", { name: "Department" });

    await user.type(field, "Design");
    await user.click(within(dialog).getByRole("button", { name: "Create" }));

    expect(await within(dialog).findByRole("alert")).toHaveTextContent(
      "Something went wrong. Please try again later",
    );
    expect(field).toHaveValue("Design");
  });

  it("create: Cancel closes without a request", async () => {
    const create = vi.fn();
    const { user } = renderWithProviders(<CreateHarness create={create} />);
    const dialog = await openDialog(user, "Create department");

    await user.click(within(dialog).getByRole("button", { name: "Cancel" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(create).not.toHaveBeenCalled();
  });

  it("update: shows the current name, and Save waits for a change", async () => {
    const { user } = renderWithProviders(<UpdateHarness update={vi.fn()} />);
    const dialog = await openDialog(user, "Edit department");
    const field = within(dialog).getByRole("textbox", { name: "Department" });
    const submit = within(dialog).getByRole("button", { name: "Save" });

    expect(field).toHaveValue("Engineering");
    expect(submit).toBeDisabled();

    await user.type(field, "s");
    await waitFor(() => expect(submit).toBeEnabled());
  });

  it("update: a trailing space alone keeps Save disabled, a real change enables it, reverting disables it again", async () => {
    const { user } = renderWithProviders(<UpdateHarness update={vi.fn()} />);
    const dialog = await openDialog(user, "Edit department");
    const field = within(dialog).getByRole("textbox", { name: "Department" });
    const submit = within(dialog).getByRole("button", { name: "Save" });

    await user.type(field, " ");
    expect(field).toHaveValue("Engineering ");
    expect(submit).toBeDisabled();

    await user.type(field, "s");
    await waitFor(() => expect(submit).toBeEnabled());

    await user.type(field, "{Backspace}{Backspace}");
    expect(field).toHaveValue("Engineering");
    await waitFor(() => expect(submit).toBeDisabled());
  });
});
