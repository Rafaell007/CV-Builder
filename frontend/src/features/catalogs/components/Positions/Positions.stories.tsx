import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import { Positions } from "./Positions";
import {
  designer,
  developer,
  fakeBackendMock,
  manager,
  positionsErrorMock,
  positionsMock,
} from "./positions.mocks";

const desktop = { viewport: { value: "desktop", isRotated: false } };
const tablet = { viewport: { value: "tablet", isRotated: false } };

// The page is the shared CatalogPage; the Departments stories show every state and modal in full.
const sample = [designer, developer, manager];
const body = within(document.body);

const meta = {
  title: "Features/Catalogs/Positions",
  component: Positions,
  parameters: { layout: "fullscreen" },
  globals: desktop,
} satisfies Meta<typeof Positions>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The list on a 1440px desktop screen. */
export const Desktop: Story = {
  parameters: { apollo: { mocks: [fakeBackendMock(sample)] } },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText("Designer")).toBeInTheDocument();
    await expect(canvas.getByRole("button", { name: "CREATE POSITION" })).toBeInTheDocument();
  },
};

/** The same list on a 768px tablet screen. */
export const Tablet: Story = {
  globals: tablet,
  parameters: { apollo: { mocks: [fakeBackendMock(sample)] } },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText("Manager")).toBeInTheDocument();
  },
};

export const Empty: Story = {
  parameters: { apollo: { mocks: [positionsMock([])] } },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText("No positions found")).toBeInTheDocument();
  },
};

export const LoadFailed: Story = {
  parameters: { apollo: { mocks: [positionsErrorMock()] } },
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole("button", { name: "Retry" })).toBeInTheDocument();
  },
};

export const Polish: Story = {
  globals: { ...desktop, locale: "pl" },
  parameters: { apollo: { mocks: [fakeBackendMock(sample)] } },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText("Designer")).toBeInTheDocument();
    await expect(canvas.getByRole("button", { name: "UTWÓRZ STANOWISKO" })).toBeInTheDocument();
  },
};

/** CREATE POSITION opens the empty modal with the Position field. */
export const CreatePosition: Story = {
  parameters: { apollo: { mocks: [fakeBackendMock(sample)] } },
  play: async ({ canvas }) => {
    await userEvent.click(await canvas.findByRole("button", { name: "CREATE POSITION" }));
    const dialog = await body.findByRole("dialog", { name: "Create position" });
    await expect(within(dialog).getByRole("textbox", { name: "Position" })).toHaveValue("");
  },
};
