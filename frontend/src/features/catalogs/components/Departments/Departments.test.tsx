import { screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "@/shared/testing";
import { Departments } from "./Departments";
import {
  createDepartmentMock,
  createDepartmentNetworkErrorMock,
  createDepartmentRefusedMock,
  deleteDepartmentMock,
  deleteDepartmentNetworkErrorMock,
  deleteDepartmentRefusedMock,
  departmentsErrorMock,
  departmentsMock,
  engineering,
  finance,
  marketing,
  updateDepartmentMock,
  updateDepartmentRefusedMock,
  variablesFor,
} from "./departments.mocks";

type User = ReturnType<typeof renderWithProviders>["user"];

const names = () =>
  screen
    .getAllByRole("row")
    .slice(1)
    .map((row) => within(row).getAllByRole("cell")[0]!.textContent);

async function waitForLoaded() {
  await waitFor(() =>
    expect(screen.queryByRole("status", { name: "Loading departments" })).not.toBeInTheDocument(),
  );
}

async function openRowAction(user: User, name: string, action: "Edit" | "Delete") {
  await user.click(await screen.findByRole("button", { name: `Actions for ${name}` }));
  await user.click(screen.getByRole("menuitem", { name: action }));
}

describe("Departments", () => {
  describe("list", () => {
    it("shows a loading state inside the table while the departments load", () => {
      renderWithProviders(<Departments />, { mocks: [departmentsMock([engineering])] });

      expect(screen.getByRole("status", { name: "Loading departments" })).toBeInTheDocument();
      expect(screen.getByRole("table", { name: "Departments list" })).toBeInTheDocument();
    });

    it("shows the departments of the backend with a row menu each (AC-4, AC-5, AC-18)", async () => {
      renderWithProviders(<Departments />, { mocks: [departmentsMock([engineering, finance])] });

      expect(await screen.findByText("Engineering")).toBeInTheDocument();
      expect(names()).toEqual(["Engineering", "Finance"]);
      expect(screen.getByRole("button", { name: "Actions for Finance" })).toBeInTheDocument();
      expect(screen.getByRole("columnheader", { name: "Actions" })).toBeInTheDocument();
    });

    it("shows No departments found when the backend has none", async () => {
      renderWithProviders(<Departments />, { mocks: [departmentsMock([])] });

      expect(await screen.findByText("No departments found")).toBeInTheDocument();
    });

    it("shows an error with Retry, not an empty table, and loads again on Retry (AC-35)", async () => {
      const { user } = renderWithProviders(<Departments />, {
        mocks: [departmentsErrorMock(), departmentsMock([engineering])],
      });

      expect(await screen.findByRole("alert")).toHaveTextContent(
        "Something went wrong. Please try again later",
      );
      expect(screen.queryByText("No departments found")).not.toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: "Retry" }));

      expect(await screen.findByText("Engineering")).toBeInTheDocument();
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("shows the texts in Polish", async () => {
      renderWithProviders(<Departments />, { locale: "pl", mocks: [departmentsMock([])] });

      expect(screen.getByRole("button", { name: "UTWÓRZ DZIAŁ" })).toBeInTheDocument();
      expect(await screen.findByText("Nie znaleziono działów")).toBeInTheDocument();
    });
  });

  describe("search, sort and pages on the backend", () => {
    it("sends the search and shows what the backend returns (AC-6, AC-8)", async () => {
      const { user } = renderWithProviders(<Departments />, {
        mocks: [
          departmentsMock([engineering, finance]),
          departmentsMock([finance], { variables: variablesFor({ search: "FIN" }) }),
        ],
      });
      await screen.findByText("Engineering");

      await user.type(screen.getByRole("searchbox", { name: "Search departments" }), "FIN{Enter}");

      await waitFor(() => expect(screen.queryByText("Engineering")).not.toBeInTheDocument());
      await waitForLoaded();
      expect(names()).toEqual(["Finance"]);
    });

    it("shows No departments found for a search without results", async () => {
      const { user } = renderWithProviders(<Departments />, {
        mocks: [
          departmentsMock([engineering]),
          departmentsMock([], { variables: variablesFor({ search: "xyz" }) }),
        ],
      });
      await screen.findByText("Engineering");

      await user.type(screen.getByRole("searchbox", { name: "Search departments" }), "xyz{Enter}");

      expect(await screen.findByText("No departments found")).toBeInTheDocument();
    });

    it("starts sorted by name ascending and asks the backend for descending on a click (AC-9, AC-10)", async () => {
      const { user } = renderWithProviders(<Departments />, {
        mocks: [
          departmentsMock([engineering, finance]),
          departmentsMock([finance, engineering], {
            variables: variablesFor({ sort: { field: "name", direction: "DESC" } }),
          }),
        ],
      });
      await screen.findByText("Engineering");
      expect(screen.getByRole("columnheader", { name: "Name" })).toHaveAttribute(
        "aria-sort",
        "ascending",
      );

      await user.click(screen.getByRole("button", { name: "Name" }));

      await waitFor(() =>
        expect(screen.getByRole("columnheader", { name: "Name" })).toHaveAttribute(
          "aria-sort",
          "descending",
        ),
      );
      await waitForLoaded();
      expect(names()).toEqual(["Finance", "Engineering"]);
    });

    it("asks the backend for the next page (AC-11)", async () => {
      const pageTwo = variablesFor({ page: { number: 2, size: 10 } });
      const { user } = renderWithProviders(<Departments />, {
        mocks: [
          departmentsMock([engineering], { total: 11 }),
          departmentsMock([marketing], { variables: pageTwo, total: 11 }),
        ],
      });
      await screen.findByText("Engineering");

      await user.click(screen.getByRole("button", { name: "Page 2" }));

      expect(await screen.findByText("Marketing")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Page 2" })).toHaveAttribute(
        "aria-current",
        "page",
      );
    });
  });

  describe("create", () => {
    async function openCreate(user: User) {
      await screen.findByText("Engineering");
      await user.click(screen.getByRole("button", { name: "CREATE DEPARTMENT" }));
      return screen.findByRole("dialog", { name: "Create department" });
    }

    it("opens an empty form, and CREATE waits for a name (AC-13, AC-15)", async () => {
      const { user } = renderWithProviders(<Departments />, {
        mocks: [departmentsMock([engineering])],
      });

      const dialog = await openCreate(user);

      expect(within(dialog).getByRole("textbox", { name: "Department" })).toHaveValue("");
      expect(within(dialog).getByRole("button", { name: "Create" })).toBeDisabled();
    });

    it("shows the required message for a name of spaces once the field is left (AC-30)", async () => {
      const { user } = renderWithProviders(<Departments />, {
        mocks: [departmentsMock([engineering])],
      });
      const dialog = await openCreate(user);

      await user.type(within(dialog).getByRole("textbox", { name: "Department" }), "   ");
      await user.tab();

      expect(await within(dialog).findByText("Department name is required")).toBeInTheDocument();
      expect(within(dialog).getByRole("button", { name: "Create" })).toBeDisabled();
    });

    it("sends the trimmed name, closes, shows a toast and the new row after the reload (AC-14)", async () => {
      const { user } = renderWithProviders(<Departments />, {
        mocks: [
          departmentsMock([engineering]),
          createDepartmentMock("Design"),
          departmentsMock([{ ...engineering, id: "new-1", name: "Design" }, engineering]),
        ],
      });
      const dialog = await openCreate(user);

      await user.type(within(dialog).getByRole("textbox", { name: "Department" }), "  Design ");
      await user.click(within(dialog).getByRole("button", { name: "Create" }));

      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
      expect(await screen.findByText("Design was added to the departments.")).toBeInTheDocument();
      await waitFor(() => expect(names()).toEqual(["Design", "Engineering"]));
    });

    it("keeps the name and shows Department already exists under the field for a CONFLICT (AC-16, AC-32)", async () => {
      const { user } = renderWithProviders(<Departments />, {
        mocks: [departmentsMock([engineering]), createDepartmentRefusedMock("engineering")],
      });
      const dialog = await openCreate(user);
      const field = within(dialog).getByRole("textbox", { name: "Department" });

      await user.type(field, "engineering");
      await user.click(within(dialog).getByRole("button", { name: "Create" }));

      expect(await within(dialog).findByText("Department already exists")).toBeInTheDocument();
      expect(field).toHaveValue("engineering");
      expect(field).toHaveFocus();
    });

    it("keeps the name and shows a general message when the request fails (AC-31, AC-33)", async () => {
      const { user } = renderWithProviders(<Departments />, {
        mocks: [departmentsMock([engineering]), createDepartmentNetworkErrorMock("Design")],
      });
      const dialog = await openCreate(user);
      const field = within(dialog).getByRole("textbox", { name: "Department" });

      await user.type(field, "Design");
      await user.click(within(dialog).getByRole("button", { name: "Create" }));

      expect(await within(dialog).findByRole("alert")).toHaveTextContent(
        "Something went wrong. Please try again later",
      );
      expect(field).toHaveValue("Design");
      expect(screen.queryByText(/Failed to fetch/)).not.toBeInTheDocument();
    });

    it("never shows the English backend text of an error code it does not know", async () => {
      const { user } = renderWithProviders(<Departments />, {
        mocks: [
          departmentsMock([engineering]),
          createDepartmentRefusedMock("Design", {
            code: "FORBIDDEN",
            message: "Admin role required",
          }),
        ],
      });
      const dialog = await openCreate(user);

      await user.type(within(dialog).getByRole("textbox", { name: "Department" }), "Design");
      await user.click(within(dialog).getByRole("button", { name: "Create" }));

      expect(await within(dialog).findByRole("alert")).toBeInTheDocument();
      expect(screen.queryByText("Admin role required")).not.toBeInTheDocument();
    });
  });

  describe("update", () => {
    async function openEdit(user: User, name = "Engineering") {
      await openRowAction(user, name, "Edit");
      return screen.findByRole("dialog", { name: "Update department" });
    }

    it("opens the form filled with the name of the row (AC-20, AC-21)", async () => {
      const { user } = renderWithProviders(<Departments />, {
        mocks: [departmentsMock([engineering, finance])],
      });

      const dialog = await openEdit(user, "Finance");

      expect(within(dialog).getByRole("textbox", { name: "Department" })).toHaveValue("Finance");
      // Nothing changed yet.
      expect(within(dialog).getByRole("button", { name: "Update" })).toBeDisabled();
    });

    it("saves the new name for the id of the row and shows it after the reload (AC-22)", async () => {
      const { user } = renderWithProviders(<Departments />, {
        mocks: [
          departmentsMock([engineering, finance]),
          updateDepartmentMock(engineering.id, "R&D"),
          departmentsMock([finance, { ...engineering, name: "R&D" }]),
        ],
      });
      const dialog = await openEdit(user);
      const field = within(dialog).getByRole("textbox", { name: "Department" });

      await user.clear(field);
      await user.type(field, "R&D");
      await user.click(within(dialog).getByRole("button", { name: "Update" }));

      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
      expect(await screen.findByText("R&D was saved.")).toBeInTheDocument();
      await waitFor(() => expect(names()).toEqual(["Finance", "R&D"]));
    });

    it("keeps the name and shows Department already exists for a CONFLICT (AC-23)", async () => {
      const { user } = renderWithProviders(<Departments />, {
        mocks: [
          departmentsMock([engineering, finance]),
          updateDepartmentRefusedMock(engineering.id, "Finance"),
        ],
      });
      const dialog = await openEdit(user);
      const field = within(dialog).getByRole("textbox", { name: "Department" });

      await user.clear(field);
      await user.type(field, "Finance");
      await user.click(within(dialog).getByRole("button", { name: "Update" }));

      expect(await within(dialog).findByText("Department already exists")).toBeInTheDocument();
      expect(field).toHaveValue("Finance");
    });

    it("shows the form in Polish", async () => {
      const { user } = renderWithProviders(<Departments />, {
        locale: "pl",
        mocks: [departmentsMock([engineering])],
      });
      await user.click(await screen.findByRole("button", { name: "Akcje dla działu Engineering" }));
      await user.click(screen.getByRole("menuitem", { name: "Edytuj" }));

      const dialog = await screen.findByRole("dialog", { name: "Aktualizuj dział" });
      expect(within(dialog).getByRole("textbox", { name: "Dział" })).toHaveValue("Engineering");
    });
  });

  describe("delete", () => {
    async function openDelete(user: User, name: string) {
      await openRowAction(user, name, "Delete");
      return screen.findByRole("alertdialog");
    }

    it("asks with the name of the row in the message (AC-24, AC-25)", async () => {
      const { user } = renderWithProviders(<Departments />, {
        mocks: [departmentsMock([engineering, finance])],
      });

      const dialog = await openDelete(user, "Finance");

      expect(
        within(dialog).getByRole("heading", { name: "Delete department" }),
      ).toBeInTheDocument();
      expect(dialog).toHaveTextContent("Are you sure you want to delete department Finance?");
    });

    it("closes on Cancel without a request", async () => {
      // No delete mock: a request would fail the test with an error toast.
      const { user } = renderWithProviders(<Departments />, {
        mocks: [departmentsMock([engineering, finance])],
      });
      const dialog = await openDelete(user, "Engineering");

      await user.click(within(dialog).getByRole("button", { name: "Cancel" }));

      await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
      expect(names()).toEqual(["Engineering", "Finance"]);
    });

    it("sends the mutation on Confirm, closes, and the row leaves the table (AC-26, AC-29)", async () => {
      const { user } = renderWithProviders(<Departments />, {
        mocks: [
          departmentsMock([engineering, finance]),
          deleteDepartmentMock(engineering.id),
          departmentsMock([finance]),
        ],
      });
      const dialog = await openDelete(user, "Engineering");

      await user.click(within(dialog).getByRole("button", { name: "Confirm" }));

      await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
      await waitFor(() => expect(names()).toEqual(["Finance"]));
    });

    it("sends one request when Confirm is pressed twice", async () => {
      const slowDelete = { ...deleteDepartmentMock(engineering.id), delay: 300 };
      const { user } = renderWithProviders(<Departments />, {
        mocks: [departmentsMock([engineering, finance]), slowDelete, departmentsMock([finance])],
      });
      const dialog = await openDelete(user, "Engineering");

      await user.dblClick(within(dialog).getByRole("button", { name: "Confirm" }));

      await waitFor(() => expect(names()).toEqual(["Finance"]));
      expect(screen.queryByText("Could not delete the department")).not.toBeInTheDocument();
    });

    it("shows the translated in-use text in a toast and keeps the row for a CONFLICT (AC-27)", async () => {
      const { user } = renderWithProviders(<Departments />, {
        mocks: [
          departmentsMock([engineering, finance]),
          deleteDepartmentRefusedMock(engineering.id, { message: "Used by 3 users" }),
        ],
      });
      const dialog = await openDelete(user, "Engineering");

      await user.click(within(dialog).getByRole("button", { name: "Confirm" }));

      expect(
        await screen.findByText("Department cannot be deleted because it is currently in use"),
      ).toBeInTheDocument();
      expect(screen.queryByText("Used by 3 users")).not.toBeInTheDocument();
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
      expect(names()).toEqual(["Engineering", "Finance"]);
    });

    it("shows the friendly text when the request fails", async () => {
      const { user } = renderWithProviders(<Departments />, {
        mocks: [departmentsMock([engineering]), deleteDepartmentNetworkErrorMock(engineering.id)],
      });
      const dialog = await openDelete(user, "Engineering");

      await user.click(within(dialog).getByRole("button", { name: "Confirm" }));

      expect(
        await screen.findByText("Something went wrong. Please try again."),
      ).toBeInTheDocument();
      expect(names()).toEqual(["Engineering"]);
    });

    it("goes back one page after deleting the last row of a page", async () => {
      const pageTwo = variablesFor({ page: { number: 2, size: 10 } });
      const { user } = renderWithProviders(<Departments />, {
        mocks: [
          departmentsMock([engineering], { total: 11 }),
          departmentsMock([marketing], { variables: pageTwo, total: 11 }),
          deleteDepartmentMock(marketing.id),
          // The reload of page 2 after the delete: it is empty now.
          departmentsMock([], { variables: pageTwo, total: 10 }),
          departmentsMock([engineering], { total: 10 }),
        ],
      });
      await screen.findByText("Engineering");
      await user.click(screen.getByRole("button", { name: "Page 2" }));
      const dialog = await openDelete(user, "Marketing");

      await user.click(within(dialog).getByRole("button", { name: "Confirm" }));

      await waitFor(() => expect(names()).toEqual(["Engineering"]));
      expect(screen.queryByText("No departments found")).not.toBeInTheDocument();
    });

    it("shows the confirmation in Polish", async () => {
      const { user } = renderWithProviders(<Departments />, {
        locale: "pl",
        mocks: [departmentsMock([engineering])],
      });
      await user.click(await screen.findByRole("button", { name: "Akcje dla działu Engineering" }));
      await user.click(screen.getByRole("menuitem", { name: "Usuń" }));

      expect(await screen.findByRole("alertdialog")).toHaveTextContent(
        "Czy na pewno chcesz usunąć dział Engineering?",
      );
    });
  });
});
