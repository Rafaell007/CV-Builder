import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { Users } from "./Users";
import {
  alpha,
  bravo,
  departmentOptionsMock,
  departments,
  fakeBackendMock,
  manyUsers,
  meMock,
  positionOptionsMock,
  positions,
  sampleUsers,
  usersErrorMock,
  usersMock,
} from "./users.mocks";

const desktop = { viewport: { value: "desktop", isRotated: false } };
const tablet = { viewport: { value: "tablet", isRotated: false } };

// A request that never answers, so the story stays in the loading state.
const NEVER = 2 ** 31 - 1;

const meta = {
  title: "Features/Users/Users",
  component: Users,
  // Full width, as the page fills the main area of the app.
  parameters: { layout: "fullscreen" },
  globals: desktop,
} satisfies Meta<typeof Users>;

export default meta;

type Story = StoryObj<typeof meta>;

/** An admin on a 1440px screen: CREATE USER, every column and a row menu. */
export const Admin: Story = {
  parameters: { apollo: { mocks: [meMock("ADMIN"), fakeBackendMock(sampleUsers)] } },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText(bravo.email)).toBeInTheDocument();
    await expect(canvas.getByRole("button", { name: "CREATE USER" })).toBeInTheDocument();
    await expect(canvas.getByRole("columnheader", { name: "Position" })).toBeInTheDocument();
    // The avatar header is for screen readers only: nothing shows on screen.
    const avatarHeader = canvas.getByRole("columnheader", { name: "Avatar" });
    await expect(within(avatarHeader).getByText("Avatar").getBoundingClientRect().width).toBe(1);

    await userEvent.click(canvas.getByRole("button", { name: "Actions for Bravo Tango" }));
    const menu = await within(document.body).findByRole("menu");
    await expect(within(menu).getAllByRole("menuitem")).toHaveLength(3);
    // The row menu of Figma: 90 wide at least, items 32 high, no inset above or below.
    await expect(getComputedStyle(menu).paddingTop).toBe("0px");
    await expect(within(menu).getAllByRole("menuitem")[0]!.getBoundingClientRect().height).toBe(32);
    await userEvent.keyboard("{Escape}");
  },
};

// A grey 40×40 SVG: loads without the backend.
const PHOTO =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Crect width='40' height='40' fill='%23808080'/%3E%3C/svg%3E";

/** Photos mixed with initials, as the Figma list draws them. */
export const WithPhotos: Story = {
  parameters: {
    apollo: {
      mocks: [
        meMock("ADMIN"),
        fakeBackendMock(
          sampleUsers.map((user, i) => (i % 2 ? user : { ...user, avatarUrl: PHOTO })),
        ),
      ],
    },
  },
  play: async ({ canvas }) => {
    // The avatar is hidden from screen readers (the name is in the next columns), so it is found by its tag.
    const alphaRow = await canvas.findByRole("row", { name: /Alpha/ });
    await expect(alphaRow.querySelector("img")).toHaveAttribute("src", PHOTO);
    await expect(canvas.getByText("BT")).toBeInTheDocument();
  },
};

/** An employee: no CREATE USER and no row menu; an arrow on each row opens the profile. */
export const Employee: Story = {
  parameters: { apollo: { mocks: [meMock("USER"), fakeBackendMock(sampleUsers)] } },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText(bravo.email)).toBeInTheDocument();
    await expect(canvas.queryByRole("button", { name: "CREATE USER" })).not.toBeInTheDocument();
    await expect(canvas.queryByRole("button", { name: /^Actions for/ })).not.toBeInTheDocument();
    await expect(
      canvas.getByRole("link", { name: "Open profile of Bravo Tango" }),
    ).toBeInTheDocument();
  },
};

/** 768px: Email and Position are hidden and CREATE USER is the plus icon only, as in Figma. */
export const Tablet: Story = {
  globals: tablet,
  parameters: { apollo: { mocks: [meMock("ADMIN"), fakeBackendMock(sampleUsers)] } },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText("Bravo")).toBeInTheDocument();
    await expect(canvas.queryByRole("columnheader", { name: "Email" })).toBeNull();
    await expect(canvas.queryByRole("columnheader", { name: "Position" })).toBeNull();
    await expect(canvas.queryByText(bravo.email)).toBeNull();
    const create = canvas.getByRole("button", { name: "CREATE USER" });
    await expect(create.getBoundingClientRect().width).toBe(58);
  },
};

/** 25 users make 3 pages of 10 rows: a click on a page asks the backend for it. */
export const ManyPages: Story = {
  parameters: { apollo: { mocks: [meMock("ADMIN"), fakeBackendMock(manyUsers(25))] } },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText("user01@example.com")).toBeInTheDocument();

    await userEvent.click(canvas.getByRole("button", { name: "Page 3" }));
    // The last page holds the 5 users that remain, under the header row.
    await waitFor(() => expect(canvas.getAllByRole("row")).toHaveLength(6));
    await expect(canvas.getByText("user25@example.com")).toBeInTheDocument();
  },
};

/** Search (first name, last name or email) and sort work: the stand-in backend answers every request. */
export const SearchAndSort: Story = {
  parameters: { apollo: { mocks: [meMock("ADMIN"), fakeBackendMock(sampleUsers)] } },
  play: async ({ canvas }) => {
    const search = canvas.getByRole("searchbox", { name: "Search employees" });
    const firstRow = () => canvas.getAllByRole("row")[1]!;
    await expect(await canvas.findByText(alpha.email)).toBeInTheDocument();

    await userEvent.type(search, "tango{Enter}");
    await waitFor(() => expect(canvas.queryByText(alpha.email)).not.toBeInTheDocument());
    await expect(await canvas.findByText(bravo.email)).toBeInTheDocument();

    await userEvent.clear(search);
    await userEvent.type(search, "{Enter}");
    await expect(await canvas.findByText(alpha.email)).toBeInTheDocument();

    // Department ascending: .NET (Bravo) first.
    await userEvent.click(canvas.getByRole("button", { name: "Department" }));
    await waitFor(() => expect(within(firstRow()).getByText("Bravo")).toBeVisible());
  },
};

/** A search that matches nothing: No employees found, and the search field keeps the text. */
export const NoResults: Story = {
  parameters: { apollo: { mocks: [meMock("ADMIN"), fakeBackendMock(sampleUsers)] } },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText(alpha.email)).toBeInTheDocument();
    const search = canvas.getByRole("searchbox", { name: "Search employees" });
    await userEvent.type(search, "zzz{Enter}");
    await expect(await canvas.findByText("No employees found")).toBeInTheDocument();
    await expect(search).toHaveValue("zzz");
  },
};

/** The table headers stay while the request runs. */
export const Loading: Story = {
  parameters: { apollo: { mocks: [meMock("ADMIN"), { ...usersMock([]), delay: NEVER }] } },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("status", { name: "Loading employees" })).toBeInTheDocument();
    await expect(canvas.getByRole("columnheader", { name: "First Name" })).toBeInTheDocument();
  },
};

export const LoadFailed: Story = {
  parameters: { apollo: { mocks: [meMock("ADMIN"), usersErrorMock()] } },
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole("alert")).toHaveTextContent("Failed to load employees");
    await expect(canvas.getByRole("button", { name: "Retry" })).toBeInTheDocument();
  },
};

/** The same list with Polish texts. */
export const Polish: Story = {
  globals: { ...desktop, locale: "pl" },
  parameters: { apollo: { mocks: [meMock("ADMIN"), fakeBackendMock(sampleUsers)] } },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText(alpha.email)).toBeInTheDocument();
    await expect(canvas.getByRole("columnheader", { name: "Stanowisko" })).toBeInTheDocument();
    await expect(canvas.getByRole("button", { name: "UTWÓRZ UŻYTKOWNIKA" })).toBeInTheDocument();
  },
};

/** An admin opens CREATE USER: the 860px modal with two fields per row, Role set to Employee (Figma Create user). */
export const CreateUserOpen: Story = {
  parameters: {
    apollo: {
      mocks: [
        meMock("ADMIN"),
        fakeBackendMock(sampleUsers),
        departmentOptionsMock([departments.dotNet, departments.react]),
        positionOptionsMock([positions.softwareEngineer]),
      ],
    },
  },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText(bravo.email)).toBeInTheDocument();
    await userEvent.click(canvas.getByRole("button", { name: "CREATE USER" }));
    const dialog = await within(document.body).findByRole("dialog", { name: "Create user" });
    await expect(dialog.getBoundingClientRect().width).toBe(860);
    await expect(within(dialog).getByRole("combobox", { name: "Role" })).toHaveTextContent(
      "Employee",
    );
    // Email and Password share the first row (two fields per row on desktop).
    const email = within(dialog).getByRole("textbox", { name: "Email" }).getBoundingClientRect();
    const password = within(dialog).getByLabelText("Password").getBoundingClientRect();
    await expect(password.top).toBe(email.top);
    await waitFor(() =>
      expect(within(dialog).getByRole("combobox", { name: "Department" })).toBeEnabled(),
    );
  },
};

/** An admin opens Update for another user: the data filled in, Email and Password disabled (Figma Update user). */
export const UpdateUserOpen: Story = {
  parameters: {
    apollo: {
      mocks: [
        meMock("ADMIN"),
        fakeBackendMock(sampleUsers),
        departmentOptionsMock([departments.dotNet, departments.react]),
        positionOptionsMock([positions.dataAnalyst, positions.softwareEngineer]),
      ],
    },
  },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText(bravo.email)).toBeInTheDocument();
    await userEvent.click(canvas.getByRole("button", { name: "Actions for Bravo Tango" }));
    await userEvent.click(within(document.body).getByRole("menuitem", { name: "Update" }));
    const dialog = await within(document.body).findByRole("dialog", { name: "Update user" });
    await expect(dialog.getBoundingClientRect().width).toBe(860);
    await expect(within(dialog).getByRole("textbox", { name: "Email" })).toBeDisabled();
    await expect(within(dialog).getByLabelText("Password")).toBeDisabled();
    await waitFor(() =>
      expect(within(dialog).getByRole("combobox", { name: "Department" })).toHaveTextContent(
        ".NET",
      ),
    );
    await expect(within(dialog).getByRole("button", { name: "Update" })).toBeDisabled();
  },
};

/** An admin opens Delete for another user: the confirmation with the name in bold (Figma Delete user). */
export const DeleteUserOpen: Story = {
  parameters: { apollo: { mocks: [meMock("ADMIN"), fakeBackendMock(sampleUsers)] } },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText(bravo.email)).toBeInTheDocument();
    await userEvent.click(canvas.getByRole("button", { name: "Actions for Bravo Tango" }));
    await userEvent.click(within(document.body).getByRole("menuitem", { name: "Delete" }));
    const dialog = await within(document.body).findByRole("alertdialog", { name: "Delete user" });
    await expect(dialog).toHaveTextContent("Are you sure you want to delete user Bravo Tango?");
    await expect(within(dialog).getByText("Bravo Tango").tagName).toBe("STRONG");
  },
};
