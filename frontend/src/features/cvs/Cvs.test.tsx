import { screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/shared/testing";
import { Cvs } from "./Cvs";
import {
  backendCv,
  cvsErrorMock,
  cvsMock,
  dataCv,
  fakeBackendMock,
  frontendCv,
  meMock,
  variablesFor,
} from "./cvs.mocks";

const push = vi.fn();

vi.mock("@/shared/i18n", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/shared/i18n")>()),
  useRouter: () => ({ push }),
}));

beforeEach(() => {
  push.mockClear();
});

const names = () =>
  screen
    .getAllByRole("row")
    .slice(1)
    // The detail line under a CV (the description) is a row with one wide cell.
    .filter((row) => !row.hasAttribute("data-row-detail"))
    .map((row) => within(row).getAllByRole("cell")[0]!.querySelector("span")?.textContent);

const searchField = () => screen.getByRole("searchbox", { name: "Search CVs" });

async function waitForHeaderSort(header: string, direction: "ascending" | "descending") {
  await waitFor(() =>
    expect(screen.getByRole("columnheader", { name: header })).toHaveAttribute(
      "aria-sort",
      direction,
    ),
  );
  // The rows of the new request replace the skeleton a moment later.
  await waitFor(() =>
    expect(screen.queryByRole("status", { name: "Loading CVs" })).not.toBeInTheDocument(),
  );
}

describe("Cvs", () => {
  it("shows the title, CREATE CV and a loading state while the CVs load", () => {
    renderWithProviders(<Cvs />, { mocks: [cvsMock([frontendCv])] });

    expect(screen.getByRole("heading", { name: "CVs" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "CREATE CV" })).toBeInTheDocument();
    expect(screen.getByRole("status", { name: "Loading CVs" })).toBeInTheDocument();
    // The structure of the list stays visible while loading.
    expect(screen.getByRole("table", { name: "CVs list" })).toBeInTheDocument();
  });

  it("shows the CVs of the backend", async () => {
    renderWithProviders(<Cvs />, { mocks: [cvsMock([frontendCv, backendCv])] });

    expect(await screen.findByText("Frontend Developer")).toBeInTheDocument();
    expect(screen.getByText("Backend Engineer")).toBeInTheDocument();
    expect(screen.getByText("jan.nowak@example.com")).toBeInTheDocument();
    expect(screen.queryByRole("status", { name: "Loading CVs" })).not.toBeInTheDocument();
  });

  describe("empty list", () => {
    it("shows You have no CVs yet to a signed-in user without CVs", async () => {
      renderWithProviders(<Cvs />, { mocks: [meMock("USER"), cvsMock([])] });

      expect(await screen.findByText("You have no CVs yet")).toBeInTheDocument();
    });

    it("shows No CVs found to an admin", async () => {
      renderWithProviders(<Cvs />, { mocks: [meMock("ADMIN"), cvsMock([])] });

      expect(await screen.findByText("No CVs found")).toBeInTheDocument();
      expect(screen.queryByText("You have no CVs yet")).not.toBeInTheDocument();
    });

    it("shows No CVs found for the list of one user, also for a non-admin", async () => {
      renderWithProviders(<Cvs userId="10" />, {
        mocks: [meMock("USER"), cvsMock([], { variables: variablesFor({ userId: "10" }) })],
      });

      expect(await screen.findByText("No CVs found")).toBeInTheDocument();
      expect(screen.queryByText("You have no CVs yet")).not.toBeInTheDocument();
    });
  });

  it("shows an error with a retry button, not an empty list, when the request fails", async () => {
    renderWithProviders(<Cvs />, { mocks: [cvsErrorMock()] });

    expect(await screen.findByRole("alert")).toHaveTextContent("Failed to load CVs");
    expect(screen.queryByText("You have no CVs yet")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
  });

  it("shows the CVs after Retry succeeds", async () => {
    const { user } = renderWithProviders(<Cvs />, {
      mocks: [cvsErrorMock(), cvsMock([frontendCv])],
    });

    await user.click(await screen.findByRole("button", { name: "Retry" }));

    expect(await screen.findByText("Frontend Developer")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows the texts in Polish", async () => {
    renderWithProviders(<Cvs />, { locale: "pl", mocks: [meMock("USER"), cvsMock([])] });

    expect(screen.getByRole("heading", { name: "CV" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "UTWÓRZ CV" })).toBeInTheDocument();
    expect(await screen.findByText("Nie masz jeszcze żadnych CV")).toBeInTheDocument();
  });

  describe("user id", () => {
    it("sends the user id of the prop to the backend", async () => {
      // The mock answers only a request with exactly these variables.
      renderWithProviders(<Cvs userId="10" />, {
        mocks: [cvsMock([frontendCv, dataCv], { variables: variablesFor({ userId: "10" }) })],
      });

      expect(await screen.findByText("Data Analyst")).toBeInTheDocument();
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
  });

  describe("search", () => {
    it("sends the search to the backend and shows what the backend returns", async () => {
      // The backend answer holds one CV only: the frontend shows it and does not filter by itself.
      const { user } = renderWithProviders(<Cvs />, {
        mocks: [
          cvsMock([frontendCv, backendCv]),
          cvsMock([backendCv], { variables: variablesFor({ search: "jan" }) }),
        ],
      });
      await screen.findByText("Frontend Developer");

      await user.type(searchField(), "jan");

      await waitFor(() => expect(screen.queryByText("Frontend Developer")).not.toBeInTheDocument());
      expect(await screen.findByText("Backend Engineer")).toBeInTheDocument();
    });

    it("sends one request for a search typed without Enter, after the debounce", async () => {
      const requests: (string | null | undefined)[] = [];
      const { user } = renderWithProviders(<Cvs />, {
        mocks: [fakeBackendMock([frontendCv, backendCv], (v) => requests.push(v.search))],
      });
      await screen.findByText("Frontend Developer");

      await user.type(searchField(), "jan");

      // The first request has no search. Three keystrokes send one request after the debounce, not three.
      await waitFor(() => expect(requests.length).toBeGreaterThanOrEqual(2));
      await waitFor(() => expect(screen.queryByText("Frontend Developer")).not.toBeInTheDocument());
      expect(requests).toEqual([undefined, "jan"]);
    });

    it("shows No CVs found when the search matches nothing, and keeps the search text", async () => {
      const { user } = renderWithProviders(<Cvs />, {
        mocks: [cvsMock([frontendCv]), cvsMock([], { variables: variablesFor({ search: "zzz" }) })],
      });
      await screen.findByText("Frontend Developer");

      await user.type(searchField(), "zzz{Enter}");

      expect(await screen.findByText("No CVs found")).toBeInTheDocument();
      expect(screen.queryByText("You have no CVs yet")).not.toBeInTheDocument();
      expect(searchField()).toHaveValue("zzz");
    });

    it("does not allow a search longer than the backend accepts (100 characters)", async () => {
      renderWithProviders(<Cvs />, { mocks: [cvsMock([frontendCv])] });
      await screen.findByText("Frontend Developer");

      expect(searchField()).toHaveAttribute("maxlength", "100");
    });

    it("keeps the typed search when the request fails, and Retry repeats the same request", async () => {
      const searched = variablesFor({ search: "jan" });
      const { user } = renderWithProviders(<Cvs />, {
        mocks: [
          cvsMock([frontendCv]),
          cvsErrorMock(searched),
          cvsMock([backendCv], { variables: searched }),
        ],
      });
      await screen.findByText("Frontend Developer");

      await user.type(searchField(), "jan{Enter}");

      await user.click(await screen.findByRole("button", { name: "Retry" }));
      expect(await screen.findByText("Backend Engineer")).toBeInTheDocument();
      expect(searchField()).toHaveValue("jan");
    });
  });

  describe("sort", () => {
    it("starts sorted by name ascending, and the Name header shows it", async () => {
      renderWithProviders(<Cvs />, { mocks: [cvsMock([backendCv, frontendCv])] });

      await screen.findByText("Backend Engineer");

      expect(screen.getByRole("columnheader", { name: "Name" })).toHaveAttribute(
        "aria-sort",
        "ascending",
      );
    });

    it("sends the sort to the backend and shows the rows in the order the backend returns", async () => {
      const { user } = renderWithProviders(<Cvs />, {
        mocks: [
          cvsMock([backendCv, frontendCv]),
          cvsMock([frontendCv, backendCv], {
            variables: variablesFor({ sort: { field: "name", direction: "DESC" } }),
          }),
        ],
      });
      await screen.findByText("Backend Engineer");
      expect(names()).toEqual(["Backend Engineer", "Frontend Developer"]);

      await user.click(screen.getByRole("button", { name: "Name" }));

      await waitForHeaderSort("Name", "descending");
      expect(names()).toEqual(["Frontend Developer", "Backend Engineer"]);
    });

    it("goes back to page 1 when the sort changes", async () => {
      const sorted = variablesFor({ sort: { field: "name", direction: "DESC" } });
      const { user } = renderWithProviders(<Cvs />, {
        mocks: [
          cvsMock([backendCv], { total: 25 }),
          cvsMock([frontendCv], {
            variables: variablesFor({ page: { number: 2, size: 10 } }),
            total: 25,
          }),
          cvsMock([dataCv], { variables: sorted, total: 25 }),
        ],
      });
      await screen.findByText("Backend Engineer");
      await user.click(screen.getByRole("button", { name: "Page 2" }));
      await screen.findByText("Frontend Developer");

      await user.click(screen.getByRole("button", { name: "Name" }));

      // The mock for the sorted request has page 1 only, so a wrong page would show an error.
      await screen.findByText("Data Analyst");
      expect(screen.getByRole("button", { name: "Page 1" })).toHaveAttribute(
        "aria-current",
        "page",
      );
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
  });

  describe("pagination", () => {
    const pageTwo = variablesFor({ page: { number: 2, size: 10 } });

    it("shows no page buttons when all CVs fit on one page", async () => {
      renderWithProviders(<Cvs />, { mocks: [cvsMock([frontendCv])] });
      await screen.findByText("Frontend Developer");

      expect(screen.queryByRole("navigation", { name: "CVs pagination" })).not.toBeInTheDocument();
    });

    it("shows the page buttons for the total of the backend and asks for another page", async () => {
      const { user } = renderWithProviders(<Cvs />, {
        mocks: [
          cvsMock([frontendCv], { total: 25 }),
          cvsMock([backendCv], { variables: pageTwo, total: 25 }),
        ],
      });
      await screen.findByText("Frontend Developer");
      const navigation = screen.getByRole("navigation", { name: "CVs pagination" });
      // 25 CVs with 10 rows on a page make 3 pages.
      expect(within(navigation).getByRole("button", { name: "Page 3" })).toBeInTheDocument();

      await user.click(within(navigation).getByRole("button", { name: "Page 2" }));

      expect(await screen.findByText("Backend Engineer")).toBeInTheDocument();
      expect(within(navigation).getByRole("button", { name: "Page 2" })).toHaveAttribute(
        "aria-current",
        "page",
      );
    });

    it("goes back to page 1 when the search changes", async () => {
      const searched = variablesFor({ search: "jan" });
      const { user } = renderWithProviders(<Cvs />, {
        mocks: [
          cvsMock([frontendCv], { total: 25 }),
          cvsMock([backendCv], { variables: pageTwo, total: 25 }),
          cvsMock([backendCv], { variables: searched, total: 12 }),
        ],
      });
      await screen.findByText("Frontend Developer");
      await user.click(screen.getByRole("button", { name: "Page 2" }));
      await screen.findByText("Backend Engineer");

      await user.type(searchField(), "jan{Enter}");

      // The request has page 1 (no mock for page 2 with a search exists, so a wrong page would show an error).
      await screen.findByRole("button", { name: "Page 1" });
      expect(screen.getByRole("button", { name: "Page 1" })).toHaveAttribute(
        "aria-current",
        "page",
      );
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("shows the page buttons in Polish", async () => {
      renderWithProviders(<Cvs />, {
        locale: "pl",
        mocks: [cvsMock([frontendCv], { total: 25 })],
      });
      await screen.findByText("Frontend Developer");

      expect(screen.getByRole("navigation", { name: "Paginacja CV" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Strona 2" })).toBeInTheDocument();
    });
  });

  describe("actions", () => {
    it("does not open the CV when the description is clicked", async () => {
      const onView = vi.fn();
      const { user } = renderWithProviders(<Cvs onView={onView} />, {
        mocks: [cvsMock([frontendCv])],
      });

      await user.click(await screen.findByText(frontendCv.description));

      expect(onView).not.toHaveBeenCalled();
    });

    it("does not open the CV when the menu button is clicked or Edit is selected", async () => {
      const onView = vi.fn();
      const { user } = renderWithProviders(<Cvs onView={onView} />, {
        mocks: [cvsMock([frontendCv])],
      });

      await user.click(
        await screen.findByRole("button", { name: "Actions for Frontend Developer" }),
      );
      expect(onView).not.toHaveBeenCalled();
      await user.click(screen.getByRole("menuitem", { name: "Edit" }));

      expect(await screen.findByRole("dialog", { name: "Update CV" })).toBeInTheDocument();
      expect(onView).not.toHaveBeenCalled();
    });

    it("opens the CV Details page on a row click when no onView is given", async () => {
      const { user } = renderWithProviders(<Cvs />, { mocks: [cvsMock([frontendCv])] });

      await user.click(await screen.findByText("Frontend Developer"));

      expect(push).toHaveBeenCalledExactlyOnceWith("/cvs/1/details");
    });

    it("opens the CV Details page with View in the row menu when no onView is given", async () => {
      const { user } = renderWithProviders(<Cvs />, { mocks: [cvsMock([backendCv])] });

      await user.click(await screen.findByRole("button", { name: "Actions for Backend Engineer" }));
      await user.click(screen.getByRole("menuitem", { name: "View" }));

      expect(push).toHaveBeenCalledExactlyOnceWith("/cvs/2/details");
    });

    it("opens the right dialog for each row menu item", async () => {
      const onView = vi.fn();
      const { user } = renderWithProviders(<Cvs onView={onView} />, {
        mocks: [cvsMock([frontendCv])],
      });
      const open = async (item: string) => {
        await user.click(
          await screen.findByRole("button", { name: "Actions for Frontend Developer" }),
        );
        await user.click(screen.getByRole("menuitem", { name: item }));
      };

      await open("View");
      expect(onView).toHaveBeenCalledExactlyOnceWith(frontendCv);
      expect(push).not.toHaveBeenCalled();

      await open("Edit");
      expect(await screen.findByRole("dialog", { name: "Update CV" })).toBeInTheDocument();
      expect(screen.getByRole("textbox", { name: "Name" })).toHaveValue(frontendCv.name);
      await user.click(screen.getByRole("button", { name: "Cancel" }));
      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());

      await open("Delete");
      const confirmation = await screen.findByRole("alertdialog", { name: "Delete CV" });
      expect(within(confirmation).getByText(frontendCv.name)).toBeInTheDocument();
    });

    it("opens the Create CV dialog when CREATE CV is pressed, also while the list loads", async () => {
      const { user } = renderWithProviders(<Cvs />, { mocks: [cvsMock([frontendCv])] });

      await user.click(screen.getByRole("button", { name: "CREATE CV" }));

      expect(await screen.findByRole("dialog", { name: "Create CV" })).toBeInTheDocument();
      expect(screen.getByRole("textbox", { name: "Name" })).toHaveValue("");
    });
  });
});
