import type { MockLink } from "@apollo/client/testing";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { CvSkills } from "./CvSkills";
import {
  availableCvSkillsMock,
  availableSkill,
  CV_ID,
  cvSkillsMock,
  cvSkillsNetworkErrorMock,
  sampleSkills,
} from "./cvSkills.mocks";

const desktop = { viewport: { value: "desktop", isRotated: false } };
const tablet = { viewport: { value: "tablet", isRotated: false } };

// A request that never answers, so the story stays in the loading state.
const NEVER = 2 ** 31 - 1;

/** A mock that answers every request, so a story can be replayed and a play function can open a modal twice. */
const always = (mock: MockLink.MockedResponse): MockLink.MockedResponse => ({
  ...mock,
  maxUsageCount: Number.POSITIVE_INFINITY,
});

const listAndOptions = [always(cvSkillsMock()), always(availableCvSkillsMock([availableSkill()]))];

// The actions are disabled until the skills arrive, so a story waits for the list before it presses anything.
const listShown = (canvas: ReturnType<typeof within>) =>
  canvas.findByRole("region", { name: "Programming languages" });

const meta = {
  title: "Features/Cvs/CvSkills",
  component: CvSkills,
  args: { cvId: CV_ID },
  // Full width, as the tab fills the main area of the CV page.
  parameters: { layout: "fullscreen" },
  globals: desktop,
} satisfies Meta<typeof CvSkills>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The skills grouped by category on a 1440px desktop screen, with the mastery bars. */
export const Desktop: Story = {
  parameters: { apollo: { mocks: listAndOptions } },
  play: async ({ canvas }) => {
    await expect(
      await canvas.findByRole("region", { name: "Programming languages" }),
    ).toBeVisible();
    await expect(canvas.getByRole("region", { name: "Frontend" })).toBeVisible();
    await expect(
      canvas.getByRole("button", { name: "JavaScript Mastery: Expert" }),
    ).toBeInTheDocument();
    await expect(canvas.getByRole("button", { name: "ADD SKILL" })).toBeEnabled();
  },
};

/** The same page on a 768px tablet screen: two columns of skills. */
export const Tablet: Story = {
  globals: tablet,
  parameters: { apollo: { mocks: listAndOptions } },
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole("region", { name: "Frontend" })).toBeVisible();
  },
};

/** The skills load: the skeleton shows, and the actions are disabled. */
export const Loading: Story = {
  parameters: { apollo: { mocks: [{ ...cvSkillsMock(), delay: NEVER }] } },
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole("status", { name: "Loading skills" })).toBeVisible();
    await expect(canvas.getByRole("button", { name: "ADD SKILL" })).toBeDisabled();
  },
};

/** A CV without skills: not an error, and ADD SKILL stays available. */
export const Empty: Story = {
  parameters: { apollo: { mocks: [always(cvSkillsMock([]))] } },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText("No skills added yet")).toBeVisible();
    await expect(canvas.getByRole("button", { name: "ADD SKILL" })).toBeEnabled();
    await expect(canvas.getByRole("button", { name: "REMOVE SKILLS" })).toBeDisabled();
  },
};

/** A network or server error: the message with Retry. */
export const LoadFailed: Story = {
  parameters: { apollo: { mocks: [cvSkillsNetworkErrorMock()] } },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText("Failed to load skills")).toBeVisible();
    await expect(canvas.getByRole("button", { name: "Retry" })).toBeVisible();
  },
};

/** REMOVE SKILLS starts the selection mode: two skills are chosen, REMOVE shows the count. */
export const SelectionMode: Story = {
  parameters: { apollo: { mocks: listAndOptions } },
  play: async ({ canvas }) => {
    await listShown(canvas);
    await userEvent.click(canvas.getByRole("button", { name: "REMOVE SKILLS" }));
    await userEvent.click(canvas.getByRole("button", { name: /JavaScript/ }));
    await userEvent.click(canvas.getByRole("button", { name: /React/ }));

    await expect(canvas.getByRole("button", { name: "Remove 2" })).toBeEnabled();
    await expect(canvas.getByRole("button", { name: /JavaScript/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  },
};

/** The Add skill modal with the skills of the CV owner that the CV does not hold yet. */
export const AddSkillModal: Story = {
  parameters: { apollo: { mocks: listAndOptions } },
  play: async ({ canvas }) => {
    await listShown(canvas);
    await userEvent.click(canvas.getByRole("button", { name: "ADD SKILL" }));

    const dialog = within(await within(document.body).findByRole("dialog", { name: "Add skill" }));
    const field = dialog.getByRole("combobox", { name: "Skill" });
    await waitFor(() => expect(field).toBeEnabled());
    await expect(dialog.getByRole("button", { name: "Add" })).toBeDisabled();
    await userEvent.click(field);
    await userEvent.click(await within(document.body).findByRole("option", { name: "Docker" }));
    await expect(dialog.getByRole("button", { name: "Add" })).toBeEnabled();
  },
};

/** The Update skill modal: the Skill field is disabled, the mastery can change. */
export const UpdateSkillModal: Story = {
  parameters: { apollo: { mocks: listAndOptions } },
  play: async ({ canvas }) => {
    await userEvent.click(await canvas.findByRole("button", { name: /TypeScript/ }));

    const dialog = within(
      await within(document.body).findByRole("dialog", { name: "Update skill" }),
    );
    await expect(dialog.getByRole("combobox", { name: /Skill/ })).toBeDisabled();
    await expect(dialog.getByRole("combobox", { name: /Mastery/ })).toHaveTextContent("Advanced");
    await expect(dialog.getByRole("button", { name: "Save" })).toBeDisabled();
  },
};

/** The confirmation with the number of chosen skills. */
export const RemoveSkillsModal: Story = {
  parameters: { apollo: { mocks: listAndOptions } },
  play: async ({ canvas }) => {
    await listShown(canvas);
    await userEvent.click(canvas.getByRole("button", { name: "REMOVE SKILLS" }));
    await userEvent.click(canvas.getByRole("button", { name: /JavaScript/ }));
    await userEvent.click(canvas.getByRole("button", { name: /TypeScript/ }));
    await userEvent.click(canvas.getByRole("button", { name: "Remove 2" }));

    const dialog = await within(document.body).findByRole("alertdialog", {
      name: "Remove skills",
    });
    await expect(dialog).toHaveTextContent("Are you sure you want to remove 2 skills?");
  },
};

export const Polish: Story = {
  globals: { locale: "pl" },
  parameters: { apollo: { mocks: listAndOptions } },
  play: async ({ canvas }) => {
    await listShown(canvas);
    await expect(canvas.getByRole("button", { name: "DODAJ UMIEJĘTNOŚĆ" })).toBeEnabled();
    await expect(canvas.getByRole("button", { name: "USUŃ UMIEJĘTNOŚCI" })).toBeVisible();
    await expect(
      canvas.getByRole("button", { name: `${sampleSkills[0]!.name} Poziom: Ekspert` }),
    ).toBeVisible();
  },
};
