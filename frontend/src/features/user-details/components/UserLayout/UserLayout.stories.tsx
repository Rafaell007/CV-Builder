import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Suspense } from "react";
import { expect, within } from "storybook/test";
import { meMock, userMock } from "../../user-details.mocks";
import { UserLayout } from "./UserLayout";
import { UserLayoutSkeleton } from "./UserLayoutSkeleton";

// On the page the route layout preloads `me` and `user(id)` on the server (PLAN D6) and shows `UserLayoutSkeleton`
// while they load; here the mocks answer them, inside the same kind of <Suspense>.
const meta = {
  title: "Features/UserDetails/UserLayout",
  component: UserLayout,
  args: { userId: "10", children: <p>Tab page</p> },
  decorators: [
    (Story) => (
      <Suspense fallback={<UserLayoutSkeleton />}>
        <Story />
      </Suspense>
    ),
  ],
  parameters: {
    layout: "fullscreen",
    nextjs: { navigation: { pathname: "/en/users/10/profile" } },
  },
} satisfies Meta<typeof UserLayout>;

export default meta;

type Story = StoryObj<typeof meta>;

const tabs = (canvasElement: HTMLElement) =>
  within(within(canvasElement).getByRole("navigation", { name: "Employee sections" }));

/** An Admin: the four tabs, CVs included; the employee's name in the breadcrumbs. */
export const Admin: Story = {
  parameters: { apollo: { mocks: [meMock("ADMIN"), userMock("10")] } },
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByText("Tab page")).toBeInTheDocument();
    await expect(tabs(canvasElement).getAllByRole("link")).toHaveLength(4);
    await expect(within(canvasElement).getByText("Emma Employee")).toBeInTheDocument();
  },
};

/** An employee: no CVs tab. */
export const Employee: Story = {
  parameters: { apollo: { mocks: [meMock("USER"), userMock("10")] } },
  play: async ({ canvasElement }) => {
    await expect(await within(canvasElement).findByText("Tab page")).toBeInTheDocument();
    await expect(tabs(canvasElement).getAllByRole("link")).toHaveLength(3);
  },
};

/** While the data loads: `Employees › Loading employee`, a skeleton, no tabs. */
export const Loading: Story = {
  parameters: {
    apollo: { mocks: [meMock("ADMIN"), { ...userMock("10"), delay: 600000 }] },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByRole("status", { name: "Loading employee" }),
    ).toBeInTheDocument();
    await expect(canvas.queryByText("Tab page")).not.toBeInTheDocument();
  },
};

export const Polish: Story = {
  ...Admin,
  globals: { locale: "pl" },
  play: async ({ canvasElement }) => {
    await expect(
      await within(canvasElement).findByRole("link", { name: "Profil" }),
    ).toBeInTheDocument();
  },
};
