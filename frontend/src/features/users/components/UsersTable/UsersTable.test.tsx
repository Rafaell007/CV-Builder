import { screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/shared/testing";
import { alpha, bravo, emailOnly } from "../../users.mocks";
import { UsersTable, type UsersTableProps } from "./UsersTable";

const defaultProps: UsersTableProps = {
  users: [alpha, bravo, emailOnly],
  sort: undefined,
  onSortChange: () => undefined,
  isAdmin: true,
  currentUserId: alpha.id,
  onView: () => undefined,
  onUpdate: () => undefined,
  onDelete: () => undefined,
  loading: false,
  loadingContent: <p>Loading content</p>,
  emptyContent: <p>Empty content</p>,
};

const render = (props: Partial<UsersTableProps> = {}, locale?: "en" | "pl") =>
  renderWithProviders(<UsersTable {...defaultProps} {...props} />, locale ? { locale } : {});

const headers = () => screen.getAllByRole("columnheader").map((header) => header.textContent);
const rowOf = (text: string) => screen.getByRole("row", { name: new RegExp(text) });

// Runs `test` with the window as wide as a tablet (below 1024px), as the Figma tablet frames.
function atTabletWidth(test: () => void) {
  const original = window.innerWidth;
  window.innerWidth = 1023;
  try {
    test();
  } finally {
    window.innerWidth = original;
  }
}

describe("UsersTable", () => {
  it("shows the column headers; the avatar header is for screen readers only", () => {
    render();

    expect(headers()).toEqual([
      "Avatar",
      "First Name",
      "Last Name",
      "Email",
      "Department",
      "Position",
      "Actions",
    ]);
  });

  it("shows the initials, names, email, department and position of a user", () => {
    render();

    const row = rowOf(bravo.email);
    for (const text of ["BT", "Bravo", "Tango", ".NET", "Data Analyst"]) {
      expect(within(row).getByText(text)).toBeInTheDocument();
    }
  });

  it("shows the photo of a user who has one, the initials for the others", () => {
    const photo = "/api/users/u2/avatar?v=1";
    render({ users: [alpha, { ...bravo, avatarUrl: photo }] });

    // The avatar is hidden from screen readers (the name is in the next columns), so it is found by its tag.
    expect(rowOf(bravo.email).querySelector("img")).toHaveAttribute("src", photo);
    expect(rowOf(alpha.email).querySelector("img")).toBeNull();
    expect(within(rowOf(alpha.email)).getByText("AL")).toBeInTheDocument();
  });

  it("shows a dash for each missing value, and the email initial for a user without a name", () => {
    render();

    const row = rowOf(emailOnly.email);
    // First name, last name, department and position.
    expect(within(row).getAllByRole("img", { name: "Not filled" })).toHaveLength(4);
    expect(within(row).getByText("S")).toBeInTheDocument();
  });

  it("hides Email and Position below the desktop width", () => {
    atTabletWidth(() => {
      render();

      expect(headers()).toEqual(["Avatar", "First Name", "Last Name", "Department", "Actions"]);
      expect(screen.queryByText(alpha.email)).not.toBeInTheDocument();
      expect(screen.queryByText("Software Engineer")).not.toBeInTheDocument();
    });
  });

  it("sorts by First Name, Last Name, Department and Position, not by Email", () => {
    render();

    for (const name of ["First Name", "Last Name", "Department", "Position"]) {
      expect(screen.getByRole("button", { name })).toBeInTheDocument();
    }
    expect(screen.queryByRole("button", { name: "Email" })).not.toBeInTheDocument();
  });

  it("reports the backend field and the direction of a header click", async () => {
    const onSortChange = vi.fn();
    const { user } = render({ onSortChange, sort: { field: "firstName", direction: "ASC" } });

    await user.click(screen.getByRole("button", { name: "First Name" }));
    expect(onSortChange).toHaveBeenLastCalledWith({ field: "firstName", direction: "DESC" });

    await user.click(screen.getByRole("button", { name: "Department" }));
    expect(onSortChange).toHaveBeenLastCalledWith({ field: "department", direction: "ASC" });
  });

  it("opens the profile on a row click, for an admin and for an employee", async () => {
    const onView = vi.fn();
    const admin = render({ onView });
    await admin.user.click(within(rowOf("Bravo")).getByText("Tango"));
    expect(onView).toHaveBeenLastCalledWith(bravo);
    admin.unmount();

    const employee = render({ onView, isAdmin: false });
    await employee.user.click(within(rowOf("Alpha")).getByText("Lima"));
    expect(onView).toHaveBeenLastCalledWith(alpha);
  });

  describe("as an admin", () => {
    it("has a row menu with View, Update and Delete, and no profile arrow", async () => {
      const onView = vi.fn();
      const onUpdate = vi.fn();
      const onDelete = vi.fn();
      const { user } = render({ onView, onUpdate, onDelete });
      expect(screen.queryByRole("link")).not.toBeInTheDocument();

      const menuButton = screen.getByRole("button", { name: "Actions for Bravo Tango" });
      await user.click(menuButton);
      const items = screen.getAllByRole("menuitem").map((item) => item.textContent);
      expect(items).toEqual(["View", "Update", "Delete"]);

      await user.click(screen.getByRole("menuitem", { name: "Update" }));
      expect(onUpdate).toHaveBeenCalledWith(bravo);
      // The menu item does not click the row behind it.
      expect(onView).not.toHaveBeenCalled();

      await user.click(menuButton);
      await user.click(screen.getByRole("menuitem", { name: "Delete" }));
      expect(onDelete).toHaveBeenCalledWith(bravo);

      await user.click(menuButton);
      await user.click(screen.getByRole("menuitem", { name: "View" }));
      expect(onView).toHaveBeenCalledWith(bravo);
    });

    it("names the menu by the email for a user without a name", () => {
      render();

      expect(
        screen.getByRole("button", { name: `Actions for ${emailOnly.email}` }),
      ).toBeInTheDocument();
    });

    it("disables Delete in the admin's own row only", async () => {
      const onDelete = vi.fn();
      const { user } = render({ onDelete, currentUserId: alpha.id });

      await user.click(screen.getByRole("button", { name: "Actions for Alpha Lima" }));
      const ownDelete = screen.getByRole("menuitem", { name: "Delete" });
      expect(ownDelete).toHaveAttribute("aria-disabled", "true");
      await user.click(ownDelete);
      expect(onDelete).not.toHaveBeenCalled();
      await user.keyboard("{Escape}");

      await user.click(screen.getByRole("button", { name: "Actions for Bravo Tango" }));
      expect(screen.getByRole("menuitem", { name: "Delete" })).not.toHaveAttribute("aria-disabled");
    });

    it("gives focus back to the row's menu button after Escape", async () => {
      const { user } = render();
      const menuButton = screen.getByRole("button", { name: "Actions for Bravo Tango" });

      await user.click(menuButton);
      expect(screen.getByRole("menu")).toBeInTheDocument();
      await user.keyboard("{Escape}");

      await waitFor(() => expect(screen.queryByRole("menu")).not.toBeInTheDocument());
      expect(menuButton).toHaveFocus();
    });
  });

  describe("as an employee", () => {
    it("has a profile arrow on each row and no menu", () => {
      render({ isAdmin: false });

      expect(screen.queryByRole("button", { name: /^Actions for/ })).not.toBeInTheDocument();
      const link = within(rowOf("Bravo")).getByRole("link", {
        name: "Open profile of Bravo Tango",
      });
      expect(link).toHaveAttribute("href", "/en/users/u2/profile");
    });

    it("follows the arrow without also clicking the row", async () => {
      const onView = vi.fn();
      const { user } = render({ isAdmin: false, onView });

      await user.click(screen.getByRole("link", { name: "Open profile of Bravo Tango" }));

      expect(onView).not.toHaveBeenCalled();
    });
  });

  it("shows the loading content, and the empty content without rows", () => {
    const { rerender } = render({ loading: true });
    expect(screen.getByText("Loading content")).toBeInTheDocument();

    rerender(<UsersTable {...defaultProps} users={[]} />);
    expect(screen.getByText("Empty content")).toBeInTheDocument();
  });

  it("shows Polish texts", () => {
    render({}, "pl");

    expect(headers()).toEqual([
      "Zdjęcie",
      "Imię",
      "Nazwisko",
      "E-mail",
      "Dział",
      "Stanowisko",
      "Akcje",
    ]);
  });
});
