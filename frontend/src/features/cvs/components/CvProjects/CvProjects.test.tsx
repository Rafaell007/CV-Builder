import { describe, expect, it } from "vitest";
import { renderWithProviders, screen, waitFor, within } from "@/shared/testing";
import type { RenderWithProvidersOptions } from "@/shared/testing";
import { CvProjects } from "./CvProjects";
import {
  addCvProjectMock,
  bank,
  CV_ID,
  cvProject,
  cvProjectsMock,
  cvProjectsNetworkErrorMock,
  heldCvProjectsMock,
  projectCatalogMock,
  projectCatalogRefusedMock,
  projectRolesMock,
  removeCvProjectsMock,
  removeCvProjectsRefusedMock,
  sampleCvProjects,
  updateCvProjectMock,
} from "./cvProjects.mocks";

const [blogEntry, bankEntry] = sampleCvProjects as [
  (typeof sampleCvProjects)[number],
  (typeof sampleCvProjects)[number],
];

function setup(options: RenderWithProvidersOptions = { mocks: [cvProjectsMock()] }) {
  return renderWithProviders(<CvProjects cvId={CV_ID} />, options);
}

const loaded = () => screen.findByRole("cell", { name: "Blog" });
const rowNames = () =>
  screen
    .getAllByRole("row")
    .slice(1)
    // The line under a row (description and tags) is a row of its own.
    .filter((row) => !row.hasAttribute("data-row-detail"))
    .map((row) => within(row).getAllByRole("cell")[0]?.textContent);

describe("CvProjects", () => {
  describe("the table", () => {
    it("shows the loading state, then the projects of the CV with the columns of the page (AC-2, AC-3)", async () => {
      setup();

      expect(screen.getByRole("status", { name: "Loading projects" })).toBeInTheDocument();
      await loaded();
      for (const name of ["Name", "Domain", "Start Date", "End Date"]) {
        expect(screen.getByRole("columnheader", { name })).toBeInTheDocument();
      }
      expect(rowNames()).toEqual(["Blog", "Online Bank"]);
      const blog = screen.getByRole("row", { name: /Blog/ });
      expect(within(blog).getByText("Blogging")).toBeInTheDocument();
      expect(within(blog).getByText("02/01/2025")).toBeInTheDocument();
      expect(within(blog).getByText("11/30/2025")).toBeInTheDocument();
    });

    it("shows the description and the responsibilities as tags under the row, and no Responsibilities column", async () => {
      setup();
      await loaded();

      expect(
        screen.queryByRole("columnheader", { name: "Responsibilities" }),
      ).not.toBeInTheDocument();
      const detail = screen.getByText("A blogging website.").closest("[data-row-detail]");
      expect(detail).not.toBeNull();
      const tags = within(detail as HTMLElement).getByRole("list", { name: "Responsibilities" });
      expect(
        within(tags)
          .getAllByRole("listitem")
          .map((item) => item.textContent),
      ).toEqual(["Built the pages."]);
    });

    it("shows Present for a project without an end date, and no tags for no responsibilities", async () => {
      setup();
      await loaded();

      const bankRow = screen.getByRole("row", { name: /Online Bank/ });

      expect(within(bankRow).getByText("Present")).toBeInTheDocument();
      const bankDetail = screen
        .getByText("An online banking application.")
        .closest("[data-row-detail]");
      expect(
        within(bankDetail as HTMLElement).queryByRole("list", { name: "Responsibilities" }),
      ).not.toBeInTheDocument();
    });

    it("shows the empty state, not an error, and keeps ADD PROJECT available (AC-25)", async () => {
      setup({ mocks: [cvProjectsMock([])] });

      expect(await screen.findByText("No projects added yet")).toBeInTheDocument();
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: "ADD PROJECT" })).toBeEnabled();
    });

    it("shows the error state with Retry that repeats the request (AC-25)", async () => {
      const { user } = setup({ mocks: [cvProjectsNetworkErrorMock(), cvProjectsMock()] });

      expect(await screen.findByRole("alert")).toHaveTextContent("Failed to load projects");
      expect(screen.getByRole("searchbox", { name: "Search projects" })).toBeInTheDocument();
      await user.click(screen.getByRole("button", { name: "Retry" }));

      await loaded();
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
  });

  describe("search and sort", () => {
    const sorted = (field: string, direction: "ASC" | "DESC") => ({
      cvId: CV_ID,
      sort: { field, direction },
    });

    it("asks the backend for the search and keeps the typed text (AC-4, AC-5, AC-40)", async () => {
      const searched = { ...sorted("name", "ASC"), search: "bank" };
      const { user } = setup({
        mocks: [cvProjectsMock(), cvProjectsMock([bankEntry], searched)],
      });
      await loaded();

      await user.type(screen.getByRole("searchbox", { name: "Search projects" }), "bank");

      await waitFor(() => expect(rowNames()).toEqual(["Online Bank"]));
      expect(screen.getByRole("searchbox", { name: "Search projects" })).toHaveValue("bank");
    });

    it("shows No projects found when the search matches nothing, and the whole list after it is cleared", async () => {
      const searched = { ...sorted("name", "ASC"), search: "zzz" };
      const { user } = setup({
        mocks: [cvProjectsMock(), cvProjectsMock([], searched), cvProjectsMock()],
      });
      await loaded();
      const field = screen.getByRole("searchbox", { name: "Search projects" });

      await user.type(field, "zzz");
      expect(await screen.findByText("No projects found")).toBeInTheDocument();
      expect(field).toHaveValue("zzz");

      await user.clear(field);
      await loaded();
      expect(rowNames()).toEqual(["Blog", "Online Bank"]);
    });

    it("asks the backend to sort when a header is clicked, and shows the backend order (AC-6)", async () => {
      const { user } = setup({
        mocks: [
          cvProjectsMock(),
          cvProjectsMock([bankEntry, blogEntry], sorted("startDate", "ASC")),
        ],
      });
      await loaded();

      await user.click(screen.getByRole("button", { name: "Start Date" }));

      await waitFor(() => expect(rowNames()).toEqual(["Online Bank", "Blog"]));
      expect(screen.getByRole("columnheader", { name: "Start Date" })).toHaveAttribute(
        "aria-sort",
        "ascending",
      );
    });
  });

  describe("Remove project", () => {
    async function askToRemove(options: RenderWithProvidersOptions) {
      const view = setup(options);
      await loaded();
      await view.user.click(screen.getByRole("button", { name: "Actions for Blog" }));
      await view.user.click(screen.getByRole("menuitem", { name: "Delete" }));
      const dialog = await screen.findByRole("alertdialog", { name: "Remove project" });
      return { ...view, dialog };
    }

    it("asks for a confirmation with the name of the project, and CANCEL removes nothing (AC-21)", async () => {
      const { user, dialog } = await askToRemove({ mocks: [cvProjectsMock()] });

      expect(dialog).toHaveTextContent("Are you sure you want to remove project Blog?");
      await user.click(within(dialog).getByRole("button", { name: "Cancel" }));

      await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
      expect(rowNames()).toEqual(["Blog", "Online Bank"]);
    });

    it("removes the project after CONFIRM, closes the modal and shows the list the backend holds (AC-22)", async () => {
      const { user, dialog } = await askToRemove({
        mocks: [cvProjectsMock(), removeCvProjectsMock(["link-1"]), cvProjectsMock([bankEntry])],
      });

      await user.click(within(dialog).getByRole("button", { name: "Confirm" }));

      await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
      await waitFor(() => expect(rowNames()).toEqual(["Online Bank"]));
      expect(screen.getByText("Project removed")).toBeInTheDocument();
    });

    it("leaves the project in the table when the backend refuses (AC-42)", async () => {
      const { user, dialog } = await askToRemove({
        mocks: [cvProjectsMock(), removeCvProjectsRefusedMock(["link-1"], "FORBIDDEN")],
      });

      await user.click(within(dialog).getByRole("button", { name: "Confirm" }));

      expect(await screen.findByText("Could not remove the project")).toBeInTheDocument();
      expect(screen.getByText("You are not allowed to change this CV.")).toBeInTheDocument();
      expect(rowNames()).toEqual(["Blog", "Online Bank"]);
    });
  });

  describe("Update project", () => {
    async function openUpdate(options: RenderWithProvidersOptions) {
      const view = setup(options);
      await loaded();
      await view.user.click(screen.getByRole("button", { name: "Actions for Blog" }));
      await view.user.click(screen.getByRole("menuitem", { name: "Update" }));
      const dialog = await screen.findByRole("dialog", { name: "Update project" });
      return { ...view, dialog };
    }

    it("shows the current data, with the fields of the project disabled and SAVE disabled (AC-11 to AC-13, AC-19, AC-20)", async () => {
      const { dialog } = await openUpdate({ mocks: [cvProjectsMock(), projectRolesMock()] });

      expect(within(dialog).getByRole("combobox", { name: /Name/ })).toBeDisabled();
      expect(within(dialog).getByRole("textbox", { name: /Domain/ })).toBeDisabled();
      expect(within(dialog).getByRole("textbox", { name: /Domain/ })).toHaveValue("Blogging");
      expect(within(dialog).getByRole("textbox", { name: /Description/ })).toBeDisabled();
      expect(within(dialog).getByRole("textbox", { name: "Start Date" })).toHaveValue("02/01/2025");
      expect(within(dialog).getByRole("textbox", { name: "End Date" })).toHaveValue("11/30/2025");
      expect(within(dialog).getByRole("textbox", { name: "Responsibilities" })).toHaveValue(
        "Built the pages.",
      );
      expect(within(dialog).getByRole("button", { name: "Save" })).toBeDisabled();
    });

    it("saves a changed responsibilities text, closes the modal and shows the list again (AC-18, AC-41)", async () => {
      const input = {
        id: "link-1",
        startDate: "2025-02-01T00:00:00.000Z",
        endDate: "2025-11-30T00:00:00.000Z",
        responsibilities: "Built the pages and fixed bugs.",
        roleIds: ["role-1"],
      };
      const updated = cvProject({ ...blogEntry, responsibilities: input.responsibilities });
      const { user, dialog } = await openUpdate({
        mocks: [
          cvProjectsMock(),
          projectRolesMock(),
          updateCvProjectMock(input, updated),
          cvProjectsMock([updated, bankEntry]),
        ],
      });

      const field = within(dialog).getByRole("textbox", { name: "Responsibilities" });
      await user.clear(field);
      await user.type(field, "Built the pages and fixed bugs.");
      await user.click(within(dialog).getByRole("button", { name: "Save" }));

      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
      expect(await screen.findByText("Built the pages and fixed bugs.")).toBeInTheDocument();
      expect(screen.getByText("Project updated")).toBeInTheDocument();
    });

    it("marks the days before the start date as not available in the End Date calendar, and the days after the end date in the Start Date calendar (AC-24)", async () => {
      const { user, dialog } = await openUpdate({ mocks: [cvProjectsMock(), projectRolesMock()] });

      // Start 02/01/2025, End 11/30/2025 (inside the days of the project, 01/01/2025 to 12/31/2026).
      // A click keeps the focus in the input; a bare focus would move it into the calendar (DatePicker README).
      const end = within(dialog).getByRole("textbox", { name: "End Date" });
      await user.click(end);
      await user.clear(end);
      await user.type(end, "02/15/2025");
      expect(
        await screen.findByRole("gridcell", { name: /Not available .*\b31 January 2025/ }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("gridcell", { name: /\bChoose .*\b20 February 2025/ }),
      ).toBeInTheDocument();

      const start = within(dialog).getByRole("textbox", { name: "Start Date" });
      await user.click(start);
      await user.clear(start);
      await user.type(start, "02/10/2025");
      expect(
        await screen.findByRole("gridcell", { name: /Not available .*\b16 February 2025/ }),
      ).toBeInTheDocument();
    });
  });

  describe("Add project", () => {
    // The projects that the CV holds, asked without a search: only the blog.
    const heldMock = () => heldCvProjectsMock([blogEntry]);
    const withAdd = (...mocks: NonNullable<RenderWithProvidersOptions["mocks"]>[number][]) => ({
      mocks: [
        cvProjectsMock([blogEntry]),
        projectCatalogMock(),
        projectRolesMock(),
        heldMock(),
        ...mocks,
      ],
    });

    async function openAdd(options: RenderWithProvidersOptions) {
      const view = setup(options);
      await loaded();
      await view.user.click(screen.getByRole("button", { name: "ADD PROJECT" }));
      const dialog = await screen.findByRole("dialog", { name: "Add project" });
      const project = within(dialog).getByRole("combobox", { name: /Name/ });
      await waitFor(() => expect(project).toBeEnabled());
      return { ...view, dialog, project };
    }

    it("starts with empty required fields and ADD disabled, and offers only projects the CV does not hold (AC-7, AC-14, AC-31)", async () => {
      const { user, dialog, project } = await openAdd(withAdd());

      expect(within(dialog).getByRole("button", { name: "Add" })).toBeDisabled();
      expect(within(dialog).getByRole("textbox", { name: "Start Date" })).toBeDisabled();
      await user.click(project);

      expect(screen.getAllByRole("option").map((option) => option.textContent)).toEqual([
        "Online Bank",
      ]);
    });

    it("fills Domain, Description, Environment and the dates when a project is chosen (AC-8, AC-11 to AC-13)", async () => {
      const { user, dialog, project } = await openAdd(withAdd());

      await user.click(project);
      await user.click(screen.getByRole("option", { name: "Online Bank" }));

      expect(within(dialog).getByRole("textbox", { name: /Domain/ })).toHaveValue("Finance");
      expect(within(dialog).getByRole("textbox", { name: /Domain/ })).toBeDisabled();
      expect(within(dialog).getByRole("textbox", { name: /Description/ })).toHaveValue(
        "An online banking application.",
      );
      expect(within(dialog).getByRole("combobox", { name: "Environment" })).toHaveAttribute(
        "aria-disabled",
        "true",
      );
      // The chips of the Environment field (its closed list holds hidden rows with the same names)
      expect(
        within(within(dialog).getByRole("group", { name: "Environment" })).getByText("React"),
      ).toBeInTheDocument();
      expect(within(dialog).getByRole("textbox", { name: "Start Date" })).toHaveValue("03/01/2024");
      expect(within(dialog).getByRole("textbox", { name: "End Date" })).toHaveValue("06/30/2025");
      // A project alone is not enough: at least one role is needed (AC-16).
      expect(within(dialog).getByRole("button", { name: "Add" })).toBeDisabled();
    });

    it("adds the project with the chosen role, closes the modal and shows it in the table (AC-9, AC-41)", async () => {
      const input = {
        cvId: CV_ID,
        projectId: bank.id,
        startDate: "2024-03-01T00:00:00.000Z",
        endDate: "2025-06-30T00:00:00.000Z",
        responsibilities: null,
        roleIds: ["role-1"],
      };
      const added = cvProject({ id: "link-new", project: bank, endDate: input.endDate });
      const { user, dialog, project } = await openAdd(
        withAdd(
          addCvProjectMock(input, added),
          // After the request the list loads again.
          cvProjectsMock([blogEntry, added]),
        ),
      );
      await user.click(project);
      await user.click(screen.getByRole("option", { name: "Online Bank" }));
      const roles = within(dialog).getByRole("combobox", { name: "Roles" });
      await waitFor(() => expect(roles).not.toHaveAttribute("aria-disabled", "true"));
      await user.click(roles);
      await user.click(screen.getByRole("option", { name: "Developer" }));
      await waitFor(() =>
        expect(within(dialog).getByRole("button", { name: "Add" })).toBeEnabled(),
      );

      await user.click(within(dialog).getByRole("button", { name: "Add" }));

      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
      await waitFor(() => expect(rowNames()).toEqual(["Blog", "Online Bank"]));
      expect(screen.getByText("Project added")).toBeInTheDocument();
    });

    it("says that the list could not be loaded, with Retry, for a user the catalog refuses (open point KAN-115)", async () => {
      const { user } = setup({
        mocks: [
          cvProjectsMock([blogEntry]),
          projectCatalogRefusedMock(),
          projectRolesMock(),
          heldMock(),
        ],
      });
      await loaded();

      await user.click(screen.getByRole("button", { name: "ADD PROJECT" }));

      const dialog = await screen.findByRole("dialog", { name: "Add project" });
      expect(
        await within(dialog).findByText(/The projects you can add could not be loaded/),
      ).toBeInTheDocument();
      expect(within(dialog).getByRole("button", { name: "Retry" })).toBeInTheDocument();
      expect(within(dialog).getByRole("combobox", { name: /Name/ })).toBeDisabled();
    });
  });
});
