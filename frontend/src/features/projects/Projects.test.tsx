import { screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "@/shared/testing";
import { Projects } from "./Projects";
import {
  analytics,
  banking,
  blog,
  projectsErrorMock,
  projectsMock,
  sales,
  variablesFor,
} from "./projects.mocks";

const names = () =>
  screen
    .getAllByRole("row")
    .slice(1)
    .map((row) => within(row).getAllByRole("cell")[0]!.querySelector("span")?.textContent);

describe("Projects", () => {
  it("shows the title and a loading state while the projects load", () => {
    renderWithProviders(<Projects />, { mocks: [projectsMock([blog])] });

    expect(screen.getByRole("heading", { name: "Projects" })).toBeInTheDocument();
    expect(screen.getByRole("status", { name: "Loading projects" })).toBeInTheDocument();
    // The structure of the list stays visible while loading.
    expect(screen.getByRole("table", { name: "Projects list" })).toBeInTheDocument();
  });

  it("shows the projects of the backend", async () => {
    renderWithProviders(<Projects />, { mocks: [projectsMock([blog, sales])] });

    expect(await screen.findByText("Blog")).toBeInTheDocument();
    expect(screen.getByText("Cloud Sales Management")).toBeInTheDocument();
    expect(screen.queryByRole("status", { name: "Loading projects" })).not.toBeInTheDocument();
  });

  it("shows No projects found when the backend has none", async () => {
    renderWithProviders(<Projects />, { mocks: [projectsMock([])] });

    expect(await screen.findByText("No projects found")).toBeInTheDocument();
  });

  it("shows an error with a retry button, not an empty list, when the request fails", async () => {
    renderWithProviders(<Projects />, { mocks: [projectsErrorMock()] });

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Something went wrong. Please try again later",
    );
    expect(screen.queryByText("No projects found")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
  });

  it("shows the projects after Retry succeeds", async () => {
    const { user } = renderWithProviders(<Projects />, {
      mocks: [projectsErrorMock(), projectsMock([blog])],
    });

    await user.click(await screen.findByRole("button", { name: "Retry" }));

    expect(await screen.findByText("Blog")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows the texts in Polish", async () => {
    renderWithProviders(<Projects />, { locale: "pl", mocks: [projectsMock([])] });

    expect(screen.getByRole("heading", { name: "Projekty" })).toBeInTheDocument();
    expect(await screen.findByText("Nie znaleziono projektów")).toBeInTheDocument();
  });

  describe("search", () => {
    it("sends the search to the backend and shows what the backend returns", async () => {
      // The backend answer holds Banking only: the frontend shows it and does not filter by itself.
      const { user } = renderWithProviders(<Projects />, {
        mocks: [
          projectsMock([blog, sales]),
          projectsMock([banking], { variables: variablesFor({ search: "bank" }) }),
        ],
      });
      await screen.findByText("Blog");

      await user.type(screen.getByRole("searchbox", { name: "Search projects" }), "bank");

      expect(await screen.findByText("Mobile Banking Platform")).toBeInTheDocument();
      expect(screen.queryByText("Blog")).not.toBeInTheDocument();
    });

    it("shows what the backend returns even when it does not match the typed text", async () => {
      // The backend can match the domain: the name below does not contain the search. The frontend must not filter it out.
      const { user } = renderWithProviders(<Projects />, {
        mocks: [
          projectsMock([blog]),
          projectsMock([sales], { variables: variablesFor({ search: "crm" }) }),
        ],
      });
      await screen.findByText("Blog");

      await user.type(screen.getByRole("searchbox", { name: "Search projects" }), "crm");

      expect(await screen.findByText("Cloud Sales Management")).toBeInTheDocument();
    });

    it("shows No projects found when the search matches nothing", async () => {
      const { user } = renderWithProviders(<Projects />, {
        mocks: [
          projectsMock([blog]),
          projectsMock([], { variables: variablesFor({ search: "zzz" }) }),
        ],
      });
      await screen.findByText("Blog");

      await user.type(screen.getByRole("searchbox", { name: "Search projects" }), "zzz{Enter}");

      expect(await screen.findByText("No projects found")).toBeInTheDocument();
      // Search and header stay, so the user can change the search.
      expect(screen.getByRole("searchbox", { name: "Search projects" })).toHaveValue("zzz");
    });

    it("sends no search again when the search is cleared", async () => {
      const { user } = renderWithProviders(<Projects />, {
        mocks: [
          projectsMock([blog, sales]),
          projectsMock([sales], { variables: variablesFor({ search: "crm" }) }),
          projectsMock([blog, sales]),
        ],
      });
      await screen.findByText("Blog");
      const field = screen.getByRole("searchbox", { name: "Search projects" });
      await user.type(field, "crm{Enter}");
      await screen.findByText("Cloud Sales Management");

      await user.clear(field);
      await user.type(field, "{Enter}");

      expect(await screen.findByText("Blog")).toBeInTheDocument();
    });

    it("does not allow a search longer than the backend accepts (100 characters)", async () => {
      renderWithProviders(<Projects />, { mocks: [projectsMock([blog])] });
      await screen.findByText("Blog");

      expect(screen.getByRole("searchbox", { name: "Search projects" })).toHaveAttribute(
        "maxlength",
        "100",
      );
    });

    it("keeps the typed search when the request fails, and Retry repeats the same request", async () => {
      const searched = variablesFor({ search: "bank" });
      const { user } = renderWithProviders(<Projects />, {
        mocks: [
          projectsMock([blog]),
          projectsErrorMock(searched),
          projectsMock([banking], { variables: searched }),
        ],
      });
      await screen.findByText("Blog");

      await user.type(screen.getByRole("searchbox", { name: "Search projects" }), "bank{Enter}");

      await user.click(await screen.findByRole("button", { name: "Retry" }));
      expect(await screen.findByText("Mobile Banking Platform")).toBeInTheDocument();
      expect(screen.getByRole("searchbox", { name: "Search projects" })).toHaveValue("bank");
    });
  });

  describe("sort", () => {
    it("sends the sort to the backend and shows the rows in the order the backend returns", async () => {
      const { user } = renderWithProviders(<Projects />, {
        mocks: [
          projectsMock([banking, analytics]),
          projectsMock([analytics, banking], {
            variables: variablesFor({ sort: { field: "name", direction: "ASC" } }),
          }),
        ],
      });
      await screen.findByText("Mobile Banking Platform");
      expect(names()).toEqual(["Mobile Banking Platform", "Logistics Analytics Dashboard"]);

      await user.click(screen.getByRole("button", { name: "Name" }));

      await waitForHeaderSort("Name", "ascending");
      // Only a backend request could change the order: the mock for the sorted request answers with Logistics first.
      expect(names()).toEqual(["Logistics Analytics Dashboard", "Mobile Banking Platform"]);
    });

    it("sorts by the dates with the direction of each click", async () => {
      const ascending = variablesFor({ sort: { field: "startDate", direction: "ASC" } });
      const descending = variablesFor({ sort: { field: "startDate", direction: "DESC" } });
      const { user } = renderWithProviders(<Projects />, {
        mocks: [
          projectsMock([blog, sales]),
          projectsMock([sales, blog], { variables: ascending }),
          projectsMock([blog, sales], { variables: descending }),
        ],
      });
      await screen.findByText("Blog");

      await user.click(screen.getByRole("button", { name: "Start Date" }));
      await waitForHeaderSort("Start Date", "ascending");
      await user.click(screen.getByRole("button", { name: "Start Date" }));
      await waitForHeaderSort("Start Date", "descending");

      expect(names()).toEqual(["Blog", "Cloud Sales Management"]);
    });

    it("keeps the search when the sort changes", async () => {
      const { user } = renderWithProviders(<Projects />, {
        mocks: [
          projectsMock([blog, sales]),
          projectsMock([sales], { variables: variablesFor({ search: "crm" }) }),
          projectsMock([sales], {
            variables: variablesFor({
              search: "crm",
              sort: { field: "endDate", direction: "ASC" },
            }),
          }),
        ],
      });
      await screen.findByText("Blog");
      await user.type(screen.getByRole("searchbox", { name: "Search projects" }), "crm{Enter}");
      await screen.findByText("Cloud Sales Management");

      await user.click(screen.getByRole("button", { name: "End Date" }));

      await waitForHeaderSort("End Date", "ascending");
      expect(names()).toEqual(["Cloud Sales Management"]);
      expect(screen.getByRole("searchbox", { name: "Search projects" })).toHaveValue("crm");
    });
  });

  describe("pagination", () => {
    const pageTwo = variablesFor({ page: { number: 2, size: 10 } });

    it("shows no page buttons when all projects fit on one page", async () => {
      renderWithProviders(<Projects />, { mocks: [projectsMock([blog, sales])] });
      await screen.findByText("Blog");

      expect(
        screen.queryByRole("navigation", { name: "Projects pagination" }),
      ).not.toBeInTheDocument();
    });

    it("shows the page buttons for the total of the backend and asks for another page", async () => {
      const { user } = renderWithProviders(<Projects />, {
        mocks: [
          projectsMock([blog], { total: 25 }),
          projectsMock([sales], { variables: pageTwo, total: 25 }),
        ],
      });
      await screen.findByText("Blog");
      const navigation = screen.getByRole("navigation", { name: "Projects pagination" });
      // 25 projects with 10 rows on a page make 3 pages.
      expect(within(navigation).getByRole("button", { name: "Page 3" })).toBeInTheDocument();

      await user.click(within(navigation).getByRole("button", { name: "Page 2" }));

      expect(await screen.findByText("Cloud Sales Management")).toBeInTheDocument();
      expect(within(navigation).getByRole("button", { name: "Page 2" })).toHaveAttribute(
        "aria-current",
        "page",
      );
    });

    it("goes back to page 1 when the search changes", async () => {
      const searched = variablesFor({ search: "crm" });
      const { user } = renderWithProviders(<Projects />, {
        mocks: [
          projectsMock([blog], { total: 25 }),
          projectsMock([sales], { variables: pageTwo, total: 25 }),
          projectsMock([sales], { variables: searched, total: 12 }),
        ],
      });
      await screen.findByText("Blog");
      await user.click(screen.getByRole("button", { name: "Page 2" }));
      await screen.findByText("Cloud Sales Management");

      await user.type(screen.getByRole("searchbox", { name: "Search projects" }), "crm{Enter}");

      // The request has page 1 (the mock for page 2 with a search does not exist, so a wrong page would show an error).
      await screen.findByRole("button", { name: "Page 1" });
      expect(screen.getByRole("button", { name: "Page 1" })).toHaveAttribute(
        "aria-current",
        "page",
      );
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("shows the page buttons in Polish", async () => {
      renderWithProviders(<Projects />, {
        locale: "pl",
        mocks: [projectsMock([blog], { total: 25 })],
      });
      await screen.findByText("Blog");

      expect(screen.getByRole("navigation", { name: "Paginacja projektów" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Strona 2" })).toBeInTheDocument();
    });
  });
});

async function waitForHeaderSort(header: string, direction: "ascending" | "descending") {
  await waitFor(() =>
    expect(screen.getByRole("columnheader", { name: header })).toHaveAttribute(
      "aria-sort",
      direction,
    ),
  );
  // The rows of the new request replace the skeleton a moment later.
  await waitFor(() =>
    expect(screen.queryByRole("status", { name: "Loading projects" })).not.toBeInTheDocument(),
  );
}
