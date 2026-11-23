import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, within } from "storybook/test";
import { Languages } from "./Languages";
import {
  english,
  fakeBackendMock,
  german,
  languagesErrorMock,
  languagesMock,
  polish,
} from "./languages.mocks";

const desktop = { viewport: { value: "desktop", isRotated: false } };
const tablet = { viewport: { value: "tablet", isRotated: false } };

// The page is the shared CatalogPage; the Departments stories show every shared state and the Delete modal in full.
const sample = [english, german, polish];
const body = within(document.body);

const meta = {
  title: "Features/Catalogs/Languages",
  component: Languages,
  parameters: { layout: "fullscreen" },
  globals: desktop,
} satisfies Meta<typeof Languages>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The list on a 1440px desktop screen: Name, ISO and Native name. */
export const Desktop: Story = {
  parameters: { apollo: { mocks: [fakeBackendMock(sample)] } },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText("Deutsch")).toBeInTheDocument();
    await expect(canvas.getByRole("columnheader", { name: "ISO" })).toBeInTheDocument();
    await expect(canvas.getByRole("button", { name: "CREATE LANGUAGE" })).toBeInTheDocument();
  },
};

/** The same list on a 768px tablet screen: the Native name column is hidden. */
export const Tablet: Story = {
  globals: tablet,
  parameters: { apollo: { mocks: [fakeBackendMock(sample)] } },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText("Polish")).toBeInTheDocument();
    await expect(
      canvas.queryByRole("columnheader", { name: "Native name" }),
    ).not.toBeInTheDocument();
  },
};

export const Empty: Story = {
  parameters: { apollo: { mocks: [languagesMock([])] } },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText("No languages found")).toBeInTheDocument();
  },
};

export const LoadFailed: Story = {
  parameters: { apollo: { mocks: [languagesErrorMock()] } },
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole("button", { name: "Retry" })).toBeInTheDocument();
  },
};

export const Polish: Story = {
  globals: { ...desktop, locale: "pl" },
  parameters: { apollo: { mocks: [fakeBackendMock(sample)] } },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText("German")).toBeInTheDocument();
    await expect(canvas.getByRole("button", { name: "UTWÓRZ JĘZYK" })).toBeInTheDocument();
  },
};

/** CREATE LANGUAGE opens the empty modal; Create waits for all three fields. */
export const CreateLanguage: Story = {
  parameters: { apollo: { mocks: [fakeBackendMock(sample)] } },
  play: async ({ canvas }) => {
    await userEvent.click(await canvas.findByRole("button", { name: "CREATE LANGUAGE" }));
    const dialog = await body.findByRole("dialog", { name: "Create language" });

    await expect(within(dialog).getByRole("textbox", { name: "Name" })).toHaveValue("");
    await expect(within(dialog).getByRole("textbox", { name: "ISO" })).toHaveValue("");
    await expect(within(dialog).getByRole("textbox", { name: "Native name" })).toHaveValue("");
    await expect(within(dialog).getByRole("button", { name: "Create" })).toBeDisabled();
  },
};

/** Edit opens the modal filled with the values of the row; Update waits for a change. */
export const UpdateLanguage: Story = {
  parameters: { apollo: { mocks: [fakeBackendMock(sample)] } },
  play: async ({ canvas }) => {
    await userEvent.click(await canvas.findByRole("button", { name: "Actions for German" }));
    await userEvent.click(await body.findByRole("menuitem", { name: "Edit" }));
    const dialog = await body.findByRole("dialog", { name: "Update language" });

    await expect(within(dialog).getByRole("textbox", { name: "Name" })).toHaveValue("German");
    await expect(within(dialog).getByRole("textbox", { name: "ISO" })).toHaveValue("DE");
    await expect(within(dialog).getByRole("textbox", { name: "Native name" })).toHaveValue(
      "Deutsch",
    );
    await expect(within(dialog).getByRole("button", { name: "Update" })).toBeDisabled();
  },
};
