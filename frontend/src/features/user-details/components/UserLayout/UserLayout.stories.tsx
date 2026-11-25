import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Suspense } from "react";
import { expect, within } from "storybook/test";
import { meMock, userMock } from "../../user-details.mocks";
// By folder, not the `@/shared/components` barrel, like the (app) layout that renders the same fallback.
import { PageState } from "@/shared/components/PageState";
import { UserLayout } from "./UserLayout";

// On the page the route layout preloads `me` and `user(id)` on the server (PLAN D6), inside the one <Suspense> of the
// (app) layout (fallback: the loading `PageState`); here the mocks answer them, inside the same kind of <Suspense>.
const meta = {
  title: "Features/UserDetails/UserLayout",
  component: UserLayout,
  args: { userId: "10", children: <p>Tab page</p> },
  decorators: [
    (Story) => (
      <Suspense fallback={<PageState kind="loading" />}>
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

/** While the data loads: the loading `PageState` of the (app) layout's <Suspense>, no header and no tabs yet. */
export const Loading: Story = {
  parameters: {
    apollo: { mocks: [meMock("ADMIN"), { ...userMock("10"), delay: 600000 }] },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByRole("status")).toHaveAttribute("aria-busy", "true");
    await expect(canvas.queryByText("Tab page")).not.toBeInTheDocument();
    await expect(
      canvas.queryByRole("navigation", { name: "Employee sections" }),
    ).not.toBeInTheDocument();
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
