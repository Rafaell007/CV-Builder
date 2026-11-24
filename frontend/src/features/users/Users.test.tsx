import { screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/shared/testing";
import { Users } from "./Users";
import {
  alpha,
  bravo,
  charlie,
  createUserMock,
  deleteUserMock,
  deleteUserRefusedMock,
  departmentOptionsMock,
  departments,
  fakeBackendMock,
  meMock,
  positionOptionsMock,
  positions,
  updateUserMock,
  usersErrorMock,
  usersMock,
  variablesFor,
} from "./users.mocks";

const push = vi.fn();

vi.mock("@/shared/i18n", async (importOriginal) =>
  (await import("@/shared/testing/withMockedRouter")).withMockedRouter(
    await importOriginal<typeof import("@/shared/i18n")>(),
    () => ({ push }),
  ),
);

beforeEach(() => {
  push.mockClear();
});

/** The first names of the rows, top to bottom. */
const firstNames = () =>
  screen
    .getAllByRole("row")
    .slice(1)
    .map((row) => within(row).getAllByRole("cell")[1]!.textContent);

const searchField = () => screen.getByRole("searchbox", { name: "Search employees" });

async function waitForList() {
  await waitFor(() =>
    expect(screen.queryByRole("status", { name: "Loading employees" })).not.toBeInTheDocument(),
  );
}

describe("Users", () => {
  // The title is the route's PageHeader, not part of Users.
  it("shows a loading state while the users load", () => {
    renderWithProviders(<Users />, { mocks: [meMock(), usersMock([alpha])] });

    expect(screen.getByRole("status", { name: "Loading employees" })).toBeInTheDocument();
    expect(screen.getByRole("table", { name: "Employees list" })).toBeInTheDocument();
  });

  it("shows the users of the backend", async () => {
    renderWithProviders(<Users />, { mocks: [meMock(), usersMock([alpha, bravo])] });

    expect(await screen.findByText(bravo.email)).toBeInTheDocument();
    expect(firstNames()).toEqual(["Alpha", "Bravo"]);
  });

  it("waits for the role before it shows the rows, so an admin never sees employee arrows", async () => {
    // The users answer at once; the role 300 ms later.
    const users = { ...usersMock([alpha, bravo]), delay: 0 };
    const delayedMe = { ...meMock(), delay: 300 };
    renderWithProviders(<Users />, { mocks: [delayedMe, users] });

    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(screen.getByRole("status", { name: "Loading employees" })).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();

    expect(await screen.findByRole("button", { name: "Actions for Bravo Tango" })).toBeVisible();
  });

  describe("as an admin", () => {
    it("shows CREATE USER and a row menu, not the profile arrows", async () => {
      renderWithProviders(<Users />, { mocks: [meMock("ADMIN"), usersMock([alpha, bravo])] });
      await screen.findByText(bravo.email);

      expect(screen.getByRole("button", { name: "CREATE USER" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Actions for Bravo Tango" })).toBeInTheDocument();
      expect(screen.queryByRole("link")).not.toBeInTheDocument();
    });

    it("creates a user with CREATE USER, then loads the list again", async () => {
      const requests: unknown[] = [];
      const input = {
        email: "new.user@example.com",
        password: "secret123",
        firstName: "Ada",
        lastName: "Lovelace",
        departmentId: departments.react.id,
        positionId: positions.softwareEngineer.id,
        role: "USER" as const,
      };
      const { user } = renderWithProviders(<Users />, {
        mocks: [
          meMock("ADMIN"),
          fakeBackendMock([alpha, bravo], (variables) => requests.push(variables)),
          departmentOptionsMock([departments.react]),
          positionOptionsMock([positions.softwareEngineer]),
          createUserMock(input),
        ],
      });
      await screen.findByText(bravo.email);
      expect(requests).toHaveLength(1);

      await user.click(screen.getByRole("button", { name: "CREATE USER" }));
      const dialog = await screen.findByRole("dialog", { name: "Create user" });
      await user.type(within(dialog).getByRole("textbox", { name: "Email" }), input.email);
      await user.type(within(dialog).getByLabelText("Password"), input.password);
      await user.type(within(dialog).getByRole("textbox", { name: "First Name" }), "Ada");
      await user.type(within(dialog).getByRole("textbox", { name: "Last Name" }), "Lovelace");
      const department = within(dialog).getByRole("combobox", { name: "Department" });
      await waitFor(() => expect(department).toBeEnabled());
      await user.click(department);
      await user.click(await screen.findByRole("option", { name: "React" }));
      const position = within(dialog).getByRole("combobox", { name: "Position" });
      await waitFor(() => expect(position).toBeEnabled());
      await user.click(position);
      await user.click(await screen.findByRole("option", { name: "Software Engineer" }));
      await user.click(within(dialog).getByRole("button", { name: "Create" }));

      expect(await screen.findByText("User created")).toBeInTheDocument();
      expect(screen.queryByRole("dialog", { name: "Create user" })).not.toBeInTheDocument();
      // The new user's place in the sorted page is known only to the backend: the list asks again.
      await waitFor(() => expect(requests).toHaveLength(2));
    });

    it("updates a user with Update in the row menu, then loads the list again", async () => {
      const requests: unknown[] = [];
      const { user } = renderWithProviders(<Users />, {
        mocks: [
          meMock("ADMIN"),
          fakeBackendMock([alpha, bravo], (variables) => requests.push(variables)),
          departmentOptionsMock([departments.dotNet, departments.java]),
          positionOptionsMock([positions.dataAnalyst]),
          updateUserMock(
            {
              id: bravo.id,
              firstName: "Bravo",
              lastName: "Tango",
              departmentId: departments.java.id,
              positionId: positions.dataAnalyst.id,
              role: "USER",
            },
            bravo.email,
          ),
        ],
      });
      await screen.findByText(bravo.email);
      expect(requests).toHaveLength(1);

      await user.click(screen.getByRole("button", { name: "Actions for Bravo Tango" }));
      await user.click(screen.getByRole("menuitem", { name: "Update" }));
      const dialog = await screen.findByRole("dialog", { name: "Update user" });
      expect(within(dialog).getByRole("textbox", { name: "Email" })).toHaveValue(bravo.email);
      const department = within(dialog).getByRole("combobox", { name: "Department" });
      await waitFor(() => expect(department).toBeEnabled());
      await user.click(department);
      await user.click(await screen.findByRole("option", { name: "Java" }));
      await user.click(within(dialog).getByRole("button", { name: "Update" }));

      expect(await screen.findByText("User updated")).toBeInTheDocument();
      expect(screen.queryByRole("dialog", { name: "Update user" })).not.toBeInTheDocument();
      await waitFor(() => expect(requests).toHaveLength(2));
    });

    it("cannot change their own role in Update", async () => {
      const { user } = renderWithProviders(<Users />, {
        mocks: [
          meMock("ADMIN"),
          usersMock([alpha, bravo]),
          departmentOptionsMock([departments.react]),
          positionOptionsMock([positions.softwareEngineer]),
        ],
      });
      await screen.findByText(bravo.email);

      await user.click(screen.getByRole("button", { name: "Actions for Alpha Lima" }));
      await user.click(screen.getByRole("menuitem", { name: "Update" }));
      const dialog = await screen.findByRole("dialog", { name: "Update user" });

      expect(within(dialog).getByRole("combobox", { name: "Role" })).toBeDisabled();
    });

    it("cannot delete their own row", async () => {
      const { user } = renderWithProviders(<Users />, {
        mocks: [meMock("ADMIN"), usersMock([alpha, bravo])],
      });
      await screen.findByText(bravo.email);

      await user.click(screen.getByRole("button", { name: "Actions for Alpha Lima" }));

      expect(screen.getByRole("menuitem", { name: "Delete" })).toHaveAttribute(
        "aria-disabled",
        "true",
      );
    });

    describe("delete", () => {
      const pageTwo = variablesFor({ page: { number: 2, size: 10 } });

      async function confirmDelete(user: ReturnType<typeof renderWithProviders>["user"]) {
        await user.click(screen.getByRole("button", { name: "Actions for Bravo Tango" }));
        await user.click(screen.getByRole("menuitem", { name: "Delete" }));
        const dialog = await screen.findByRole("alertdialog", { name: "Delete user" });
        expect(dialog).toHaveTextContent("Are you sure you want to delete user Bravo Tango?");
        await user.click(within(dialog).getByRole("button", { name: "Confirm" }));
      }

      it("deletes a user with Delete in the row menu, then the row leaves the list", async () => {
        const { user } = renderWithProviders(<Users />, {
          // The second list answer is the reload after the delete: the backend no longer returns Bravo.
          mocks: [
            meMock("ADMIN"),
            usersMock([alpha, bravo]),
            deleteUserMock(bravo.id),
            usersMock([alpha]),
          ],
        });
        await screen.findByText(bravo.email);

        await confirmDelete(user);

        await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
        expect(await screen.findByText("User deleted")).toBeInTheDocument();
        // The list shows its loading state while it loads again, so wait for the final rows.
        await waitFor(() => expect(firstNames()).toEqual(["Alpha"]));
      });

      it("closes on Cancel without a request", async () => {
        // No delete mock: a request would fail with an error toast.
        const { user } = renderWithProviders(<Users />, {
          mocks: [meMock("ADMIN"), usersMock([alpha, bravo])],
        });
        await screen.findByText(bravo.email);
        await user.click(screen.getByRole("button", { name: "Actions for Bravo Tango" }));
        await user.click(screen.getByRole("menuitem", { name: "Delete" }));

        await user.click(
          within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Cancel" }),
        );

        await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
        expect(screen.queryByText("Could not delete the user")).not.toBeInTheDocument();
        expect(screen.getByText(bravo.email)).toBeInTheDocument();
      });

      it("shows the reason in a toast and keeps the row when the backend refuses", async () => {
        const { user } = renderWithProviders(<Users />, {
          mocks: [
            meMock("ADMIN"),
            usersMock([alpha, bravo]),
            deleteUserRefusedMock(bravo.id, { code: "FORBIDDEN" }, "Admin role required"),
          ],
        });
        await screen.findByText(bravo.email);

        await confirmDelete(user);

        expect(await screen.findByText("Could not delete the user")).toBeInTheDocument();
        expect(screen.getByText("You do not have permission to do this.")).toBeInTheDocument();
        expect(screen.queryByText("Admin role required")).not.toBeInTheDocument();
        expect(screen.getByText(bravo.email)).toBeInTheDocument();
      });

      it("goes back one page when the last user of page 2 is deleted", async () => {
        const { user } = renderWithProviders(<Users />, {
          mocks: [
            meMock("ADMIN"),
            usersMock([alpha], { total: 11 }),
            usersMock([bravo], { variables: pageTwo, total: 11 }),
            deleteUserMock(bravo.id),
            // The reload of page 2 after the delete: the page is empty now.
            usersMock([], { variables: pageTwo, total: 10 }),
            // Page 1 after the page change (the stored page 1 was removed, so it loads again).
            usersMock([alpha], { total: 10 }),
          ],
        });
        await screen.findByText(alpha.email);
        await user.click(screen.getByRole("button", { name: "Page 2" }));
        await screen.findByText(bravo.email);

        await confirmDelete(user);

        await waitFor(() => expect(firstNames()).toEqual(["Alpha"]));
        expect(screen.queryByText("No employees found")).not.toBeInTheDocument();
      });

      it("goes back one page when the last user of page 2 was already deleted by someone else", async () => {
        const { user } = renderWithProviders(<Users />, {
          mocks: [
            meMock("ADMIN"),
            usersMock([alpha], { total: 11 }),
            usersMock([bravo], { variables: pageTwo, total: 11 }),
            deleteUserRefusedMock(bravo.id, { code: "NOT_FOUND" }, "User not found"),
            // NOT_FOUND reloads page 2: another admin deleted Bravo, so it is empty now.
            usersMock([], { variables: pageTwo, total: 10 }),
            usersMock([alpha], { total: 10 }),
          ],
        });
        await screen.findByText(alpha.email);
        await user.click(screen.getByRole("button", { name: "Page 2" }));
        await screen.findByText(bravo.email);

        await confirmDelete(user);

        expect(await screen.findByText("This user no longer exists.")).toBeInTheDocument();
        await waitFor(() => expect(firstNames()).toEqual(["Alpha"]));
        expect(screen.queryByText("No employees found")).not.toBeInTheDocument();
      });

      it("stays on the page when the deleted user is not the last one of the page", async () => {
        const { user } = renderWithProviders(<Users />, {
          mocks: [
            meMock("ADMIN"),
            usersMock([alpha], { total: 12 }),
            usersMock([bravo, charlie], { variables: pageTwo, total: 12 }),
            deleteUserMock(bravo.id),
            usersMock([charlie], { variables: pageTwo, total: 11 }),
          ],
        });
        await screen.findByText(alpha.email);
        await user.click(screen.getByRole("button", { name: "Page 2" }));
        await screen.findByText(bravo.email);

        await confirmDelete(user);

        // The list shows its loading state while it loads again, so wait for the final rows.
        await waitFor(() => expect(firstNames()).toEqual(["Charlie"]));
        expect(screen.getByRole("button", { name: "Page 2" })).toHaveAttribute(
          "aria-current",
          "page",
        );
      });
    });

    it("opens the profile with View in the row menu", async () => {
      const { user } = renderWithProviders(<Users />, {
        mocks: [meMock("ADMIN"), usersMock([alpha, bravo])],
      });
      await screen.findByText(bravo.email);

      await user.click(screen.getByRole("button", { name: "Actions for Bravo Tango" }));
      await user.click(screen.getByRole("menuitem", { name: "View" }));

      expect(push).toHaveBeenCalledWith("/users/u2/profile");
    });
  });

  describe("as an employee", () => {
    it("shows no CREATE USER and no row menu, but a profile arrow on each row", async () => {
      renderWithProviders(<Users />, { mocks: [meMock("USER"), usersMock([alpha, bravo])] });
      await screen.findByText(bravo.email);

      expect(screen.queryByRole("button", { name: "CREATE USER" })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /^Actions for/ })).not.toBeInTheDocument();
      expect(screen.getByRole("link", { name: "Open profile of Bravo Tango" })).toHaveAttribute(
        "href",
        "/en/users/u2/profile",
      );
    });
  });

  it("opens the profile on a row click", async () => {
    const { user } = renderWithProviders(<Users />, {
      mocks: [meMock("USER"), usersMock([alpha, bravo])],
    });
    await screen.findByText(bravo.email);

    await user.click(screen.getByText(bravo.email));

    expect(push).toHaveBeenCalledWith("/users/u2/profile");
  });

  it("shows No employees found for an empty list", async () => {
    renderWithProviders(<Users />, { mocks: [meMock(), usersMock([])] });

    expect(await screen.findByText("No employees found")).toBeInTheDocument();
  });

  it("shows an error with a retry button, not an empty list, and the users after Retry", async () => {
    const { user } = renderWithProviders(<Users />, {
      mocks: [meMock(), usersErrorMock(), usersMock([alpha])],
    });

    expect(await screen.findByText("Failed to load employees")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    // The toolbar stays, so the search can be changed.
    expect(searchField()).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Retry" }));

    expect(await screen.findByText(alpha.email)).toBeInTheDocument();
  });

  it("shows the texts in Polish", async () => {
    renderWithProviders(<Users />, { locale: "pl", mocks: [meMock(), usersMock([alpha])] });
    await screen.findByText(alpha.email);

    expect(screen.getByRole("button", { name: "UTWÓRZ UŻYTKOWNIKA" })).toBeInTheDocument();
    expect(screen.getByRole("searchbox", { name: "Szukaj pracowników" })).toBeInTheDocument();
    expect(screen.getByRole("table", { name: "Lista pracowników" })).toBeInTheDocument();
  });

  describe("search", () => {
    it("sends the search to the backend and shows what the backend returns", async () => {
      // The backend answer holds one user only: the page shows it and does not filter by itself.
      const { user } = renderWithProviders(<Users />, {
        mocks: [
          meMock(),
          usersMock([alpha, bravo]),
          usersMock([bravo], { variables: variablesFor({ search: "tango" }) }),
        ],
      });
      await screen.findByText(alpha.email);

      await user.type(searchField(), "tango{Enter}");

      expect(await screen.findByText(bravo.email)).toBeInTheDocument();
      expect(screen.queryByText(alpha.email)).not.toBeInTheDocument();
    });

    it("sends one request for a search typed without Enter, after the debounce", async () => {
      const requests: (string | null | undefined)[] = [];
      const { user } = renderWithProviders(<Users />, {
        mocks: [meMock(), fakeBackendMock([alpha, bravo], (v) => requests.push(v.search))],
      });
      await screen.findByText(alpha.email);

      await user.type(searchField(), "tango");

      // The first request has no search. Five keystrokes send one request after the debounce, not five.
      await waitFor(() => expect(requests.length).toBeGreaterThanOrEqual(2));
      expect(await screen.findByText(bravo.email)).toBeInTheDocument();
      expect(requests).toEqual([undefined, "tango"]);
    });

    it("shows No employees found when the search matches nothing, and keeps the search text", async () => {
      const { user } = renderWithProviders(<Users />, {
        mocks: [
          meMock(),
          usersMock([alpha]),
          usersMock([], { variables: variablesFor({ search: "zzz" }) }),
        ],
      });
      await screen.findByText(alpha.email);

      await user.type(searchField(), "zzz{Enter}");

      expect(await screen.findByText("No employees found")).toBeInTheDocument();
      expect(searchField()).toHaveValue("zzz");
    });

    it("does not allow a search longer than the backend accepts (100 characters)", async () => {
      renderWithProviders(<Users />, { mocks: [meMock(), usersMock([alpha])] });

      expect(searchField()).toHaveAttribute("maxlength", "100");
    });
  });

  describe("sort", () => {
    it("starts sorted by first name ascending, and the First Name header shows it", async () => {
      renderWithProviders(<Users />, { mocks: [meMock(), usersMock([alpha])] });
      await screen.findByText(alpha.email);

      expect(screen.getByRole("columnheader", { name: "First Name" })).toHaveAttribute(
        "aria-sort",
        "ascending",
      );
    });

    it("sends the sort to the backend and shows the rows in the order the backend returns", async () => {
      const { user } = renderWithProviders(<Users />, {
        mocks: [meMock(), fakeBackendMock([alpha, bravo, charlie])],
      });
      await screen.findByText(alpha.email);
      expect(firstNames()).toEqual(["Alpha", "Bravo", "Charlie"]);

      await user.click(screen.getByRole("button", { name: "Department" }));
      await waitForList();

      // .NET (Bravo), Java (Charlie), React (Alpha).
      await waitFor(() => expect(firstNames()).toEqual(["Bravo", "Charlie", "Alpha"]));
      expect(screen.getByRole("columnheader", { name: "Department" })).toHaveAttribute(
        "aria-sort",
        "ascending",
      );
    });
  });

  describe("pagination", () => {
    const pageTwo = variablesFor({ page: { number: 2, size: 10 } });

    it("shows the page buttons for the total of the backend and asks for another page", async () => {
      const { user } = renderWithProviders(<Users />, {
        mocks: [
          meMock(),
          usersMock([alpha], { total: 25 }),
          usersMock([bravo], { variables: pageTwo, total: 25 }),
        ],
      });
      await screen.findByText(alpha.email);
      const navigation = screen.getByRole("navigation", { name: "Employees pagination" });
      // 25 users with 10 rows on a page make 3 pages.
      expect(within(navigation).getByRole("button", { name: "Page 3" })).toBeInTheDocument();

      await user.click(within(navigation).getByRole("button", { name: "Page 2" }));

      expect(await screen.findByText(bravo.email)).toBeInTheDocument();
    });

    it("goes back to page 1 when the sort changes", async () => {
      const sorted = variablesFor({ sort: { field: "lastName", direction: "ASC" } });
      const { user } = renderWithProviders(<Users />, {
        mocks: [
          meMock(),
          usersMock([alpha], { total: 25 }),
          usersMock([bravo], { variables: pageTwo, total: 25 }),
          usersMock([charlie], { variables: sorted, total: 25 }),
        ],
      });
      await screen.findByText(alpha.email);
      await user.click(screen.getByRole("button", { name: "Page 2" }));
      await screen.findByText(bravo.email);

      await user.click(screen.getByRole("button", { name: "Last Name" }));

      // Only page 1 has a mock with this sort, so a wrong page would show the error.
      expect(await screen.findByText(charlie.email)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Page 1" })).toHaveAttribute(
        "aria-current",
        "page",
      );
    });
  });
});
