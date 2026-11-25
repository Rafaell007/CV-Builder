import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Suspense } from "react";
import { expect, within } from "storybook/test";
import {
  departmentOptionsErrorMock,
  departmentOptionsMock,
  meMock,
  positionOptionsMock,
  userMock,
} from "../../user-details.mocks";
import { UserProfile } from "./UserProfile";

// The signed-in user of `meMock` has id "1". On the page the route preloads `me`, `user(id)` and the options on the
// server (PLAN D6); here the mocks answer them, and the tab reads them with useSuspenseQuery, so it needs <Suspense>.
const assigned = {
  department: { id: "d1", name: "React" },
  position: { id: "p1", name: "Software Engineer" },
};
const emma = { firstName: "Emma", lastName: "Employee" };
const options = [departmentOptionsMock(), positionOptionsMock()];

const meta = {
  title: "Features/UserDetails/UserProfile",
  component: UserProfile,
  args: { userId: "10" },
  decorators: [
    (Story) => (
      <Suspense fallback={<p>Loading</p>}>
        <Story />
      </Suspense>
    ),
  ],
  parameters: {
    layout: "padded",
    nextjs: { navigation: { pathname: "/en/users/10/profile" } },
  },
} satisfies Meta<typeof UserProfile>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The owner, email not verified yet: editable fields, VERIFY EMAIL and UPDATE (disabled until a value changes). */
export const OwnProfileNotVerified: Story = {
  args: { userId: "1" },
  parameters: {
    apollo: { mocks: [meMock("USER", false), userMock("1", emma, assigned), ...options] },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByRole("button", { name: "Verify email" })).toBeInTheDocument();
    await expect(canvas.getByRole("button", { name: "Update" })).toBeDisabled();
    await expect(canvas.getByRole("textbox", { name: /First Name/ })).not.toHaveAttribute(
      "readonly",
    );
  },
};

/** An Admin on an employee's profile: editable, no VERIFY EMAIL (it belongs to the owner). */
export const AdminEditsEmployee: Story = {
  parameters: {
    apollo: { mocks: [meMock("ADMIN"), userMock("10", emma, assigned), ...options] },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByRole("button", { name: "Update" })).toBeInTheDocument();
    await expect(canvas.queryByRole("button", { name: "Verify email" })).not.toBeInTheDocument();
  },
};

/** Another employee's profile: the same fields read-only (grey, still focusable), no buttons. */
export const ReadOnly: Story = {
  parameters: {
    apollo: { mocks: [meMock("USER"), userMock("10", emma, assigned), ...options] },
    // Figma's grey (about 1.2:1) is below WCAG 4.5:1; kept by the user's choice (docs/design-tokens.md). Warning only.
    a11y: { test: "todo" },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByRole("textbox", { name: /First Name/ })).toHaveAttribute(
      "readonly",
    );
    await expect(canvas.queryByRole("button", { name: "Update" })).not.toBeInTheDocument();
  },
};

/** A user who signed up: no name yet (the email is the heading, shown once), no department or position. */
export const NewUser: Story = {
  args: { userId: "1" },
  parameters: {
    apollo: {
      mocks: [
        meMock("USER", false),
        userMock("1", { firstName: null, lastName: null }),
        ...options,
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(
      await canvas.findByRole("heading", { level: 2, name: "emma@example.com" }),
    ).toBeInTheDocument();
  },
};

/** The Department options failed to load: the current one stays, with Retry. */
export const DepartmentsFailed: Story = {
  parameters: {
    apollo: {
      mocks: [
        meMock("ADMIN"),
        userMock("10", emma, assigned),
        departmentOptionsErrorMock(),
        positionOptionsMock(),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(await canvas.findByText("Failed to load departments")).toBeInTheDocument();
    await expect(canvas.getByRole("button", { name: "Retry" })).toBeInTheDocument();
  },
};

/** Tablet (Figma 768): one column. */
export const Tablet: Story = {
  ...OwnProfileNotVerified,
  globals: { viewport: { value: "tablet", isRotated: false } },
};

export const Polish: Story = {
  ...OwnProfileNotVerified,
  globals: { locale: "pl" },
  play: async ({ canvasElement }) => {
    await expect(
      await within(canvasElement).findByRole("button", { name: "Zweryfikuj e-mail" }),
    ).toBeInTheDocument();
  },
};
