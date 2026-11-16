import { describe, expect, it } from "vitest";
import { renderWithProviders, screen, waitFor, within } from "@/shared/testing";
import { CvSkills } from "./CvSkills";
import {
  addCvSkillMock,
  addCvSkillNetworkErrorMock,
  addCvSkillRefusedMock,
  availableCvSkillsMock,
  availableCvSkillsNetworkErrorMock,
  availableSkill,
  CV_ID,
  cvSkill,
  cvSkillsMock,
  cvSkillsNetworkErrorMock,
  removeCvSkillsMock,
  removeCvSkillsNetworkErrorMock,
  removeCvSkillsRefusedMock,
  sampleSkills,
  updateCvSkillMock,
  updateCvSkillNetworkErrorMock,
} from "./cvSkills.mocks";
import type { RenderWithProvidersOptions } from "@/shared/testing";

function setup(options: RenderWithProvidersOptions = { mocks: [cvSkillsMock()] }) {
  return renderWithProviders(<CvSkills cvId={CV_ID} />, options);
}

const skillsLoaded = () => screen.findByRole("region", { name: "Programming languages" });

describe("CvSkills", () => {
  describe("loading the skills", () => {
    it("shows the loading state and keeps the actions disabled until the skills arrive (AC-41)", async () => {
      setup();

      expect(screen.getByRole("status", { name: "Loading skills" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "ADD SKILL" })).toBeDisabled();
      expect(screen.getByRole("button", { name: "REMOVE SKILLS" })).toBeDisabled();
      await skillsLoaded();
    });

    it("shows the skills grouped by category, in the order of the backend (AC-5, AC-10)", async () => {
      setup();

      await skillsLoaded();
      const headings = screen.getAllByRole("heading", { level: 2 }).map((item) => item.textContent);
      expect(headings).toEqual(["Programming languages", "Frontend"]);
      expect(screen.getByRole("button", { name: "ADD SKILL" })).toBeEnabled();
      expect(screen.getByRole("button", { name: "REMOVE SKILLS" })).toBeEnabled();
    });

    it("shows the empty state, not an error, and keeps ADD SKILL available (AC-41)", async () => {
      setup({ mocks: [cvSkillsMock([])] });

      expect(await screen.findByText("No skills added yet")).toBeInTheDocument();
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: "ADD SKILL" })).toBeEnabled();
      expect(screen.getByRole("button", { name: "REMOVE SKILLS" })).toBeDisabled();
    });

    it("shows the error state with Retry that repeats the request", async () => {
      const { user } = setup({ mocks: [cvSkillsNetworkErrorMock(), cvSkillsMock()] });

      expect(await screen.findByRole("alert")).toHaveTextContent("Failed to load skills");
      await user.click(screen.getByRole("button", { name: "Retry" }));

      await skillsLoaded();
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
  });

  describe("Add skill", () => {
    const docker = availableSkill();
    const withAdd = (...mocks: NonNullable<RenderWithProvidersOptions["mocks"]>[number][]) => ({
      mocks: [cvSkillsMock(), availableCvSkillsMock([docker]), ...mocks],
    });

    async function openAddModal(options: RenderWithProvidersOptions) {
      const view = setup(options);
      await skillsLoaded();
      await view.user.click(screen.getByRole("button", { name: "ADD SKILL" }));
      const dialog = await screen.findByRole("dialog", { name: "Add skill" });
      return { ...view, dialog };
    }

    it("loads the options from the backend and keeps ADD disabled until a skill is chosen (AC-14, AC-17)", async () => {
      const { user, dialog } = await openAddModal(withAdd());

      expect(within(dialog).getByRole("button", { name: "Add" })).toBeDisabled();
      const field = within(dialog).getByRole("combobox", { name: "Skill" });
      await waitFor(() => expect(field).toBeEnabled());
      await user.click(field);

      expect(screen.getAllByRole("option").map((option) => option.textContent)).toEqual(["Docker"]);
      await user.click(screen.getByRole("option", { name: "Docker" }));
      expect(within(dialog).getByRole("button", { name: "Add" })).toBeEnabled();
    });

    it("adds the skill, closes the modal and shows the skill in its category after the list loads again (AC-19, AC-20)", async () => {
      const added = cvSkill({
        id: "link-new",
        skillId: docker.id,
        name: docker.name,
        mastery: docker.mastery,
        category: docker.category,
      });
      const { user, dialog } = await openAddModal(
        withAdd(addCvSkillMock(docker), cvSkillsMock([...sampleSkills, added])),
      );
      const field = within(dialog).getByRole("combobox", { name: "Skill" });
      await waitFor(() => expect(field).toBeEnabled());
      await user.click(field);
      await user.click(screen.getByRole("option", { name: "Docker" }));

      await user.click(within(dialog).getByRole("button", { name: "Add" }));

      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
      expect(await screen.findByRole("region", { name: "DevOps" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Docker/ })).toBeInTheDocument();
      expect(screen.getByText("Skill added")).toBeInTheDocument();
    });

    it("shows an optional Skill mastery field and keeps ADD enabled without a mastery", async () => {
      const { user, dialog } = await openAddModal(withAdd());
      const field = within(dialog).getByRole("combobox", { name: "Skill" });
      await waitFor(() => expect(field).toBeEnabled());
      await user.click(field);
      await user.click(screen.getByRole("option", { name: "Docker" }));

      const mastery = within(dialog).getByRole("combobox", { name: "Skill mastery" });
      expect(mastery).toBeEnabled();
      await user.click(mastery);
      expect(screen.getAllByRole("option").map((option) => option.textContent)).toEqual([
        "Beginner",
        "Elementary",
        "Intermediate",
        "Advanced",
        "Expert",
      ]);
      await user.keyboard("{Escape}");
      expect(within(dialog).getByRole("button", { name: "Add" })).toBeEnabled();
    });

    it("sends the chosen mastery with the skill", async () => {
      const added = cvSkill({
        id: "link-new",
        skillId: docker.id,
        name: docker.name,
        mastery: "EXPERT",
        category: docker.category,
      });
      const { user, dialog } = await openAddModal(
        withAdd(addCvSkillMock(docker, CV_ID, "EXPERT"), cvSkillsMock([...sampleSkills, added])),
      );
      const field = within(dialog).getByRole("combobox", { name: "Skill" });
      await waitFor(() => expect(field).toBeEnabled());
      await user.click(field);
      await user.click(screen.getByRole("option", { name: "Docker" }));
      await user.click(within(dialog).getByRole("combobox", { name: "Skill mastery" }));
      await user.click(screen.getByRole("option", { name: "Expert" }));

      await user.click(within(dialog).getByRole("button", { name: "Add" }));

      expect(
        await screen.findByRole("button", { name: "Docker Mastery: Expert" }),
      ).toBeInTheDocument();
    });

    it("says why there is nothing to choose when the owner has no more skills", async () => {
      const { dialog } = await openAddModal({
        mocks: [cvSkillsMock(), availableCvSkillsMock([])],
      });

      expect(await within(dialog).findByText(/has no more skills to add/)).toBeInTheDocument();
      expect(within(dialog).getByRole("combobox", { name: "Skill" })).toBeDisabled();
      expect(within(dialog).getByRole("button", { name: "Add" })).toBeDisabled();
    });

    it("shows a failed options request with Retry", async () => {
      const { user, dialog } = await openAddModal({
        mocks: [
          cvSkillsMock(),
          availableCvSkillsNetworkErrorMock(),
          availableCvSkillsMock([docker]),
        ],
      });

      expect(await within(dialog).findByRole("alert")).toHaveTextContent(
        "Failed to load the skills you can add.",
      );
      await user.click(within(dialog).getByRole("button", { name: "Retry" }));

      await waitFor(() =>
        expect(within(dialog).getByRole("combobox", { name: "Skill" })).toBeEnabled(),
      );
    });

    it("shows CONFLICT under the field, keeps the chosen skill and keeps the modal open (AC-37, AC-42)", async () => {
      const { user, dialog } = await openAddModal(
        // After CONFLICT the options load again.
        withAdd(addCvSkillRefusedMock(docker.id, "CONFLICT"), availableCvSkillsMock([docker])),
      );
      const field = within(dialog).getByRole("combobox", { name: "Skill" });
      await waitFor(() => expect(field).toBeEnabled());
      await user.click(field);
      await user.click(screen.getByRole("option", { name: "Docker" }));

      await user.click(within(dialog).getByRole("button", { name: "Add" }));

      expect(
        await within(dialog).findByText("This skill is already in the CV"),
      ).toBeInTheDocument();
      expect(field).toHaveTextContent("Docker");
      expect(screen.getByRole("dialog", { name: "Add skill" })).toBeInTheDocument();
    });

    it("shows a failed request in the modal and keeps the chosen skill (AC-42)", async () => {
      const { user, dialog } = await openAddModal(withAdd(addCvSkillNetworkErrorMock(docker.id)));
      const field = within(dialog).getByRole("combobox", { name: "Skill" });
      await waitFor(() => expect(field).toBeEnabled());
      await user.click(field);
      await user.click(screen.getByRole("option", { name: "Docker" }));

      await user.click(within(dialog).getByRole("button", { name: "Add" }));

      expect(await within(dialog).findByRole("alert")).toHaveTextContent("Something went wrong");
      expect(field).toHaveTextContent("Docker");
    });

    it("shows FORBIDDEN as its own message, not as a validation error", async () => {
      const { user, dialog } = await openAddModal(
        withAdd(addCvSkillRefusedMock(docker.id, "FORBIDDEN")),
      );
      const field = within(dialog).getByRole("combobox", { name: "Skill" });
      await waitFor(() => expect(field).toBeEnabled());
      await user.click(field);
      await user.click(screen.getByRole("option", { name: "Docker" }));

      await user.click(within(dialog).getByRole("button", { name: "Add" }));

      expect(await within(dialog).findByRole("alert")).toHaveTextContent(
        "You are not allowed to add skills to this CV.",
      );
    });

    it("closes with CANCEL without a request and starts empty the next time", async () => {
      const { user, dialog } = await openAddModal(
        withAdd(
          // The options load again when the modal opens the second time.
          availableCvSkillsMock([docker]),
        ),
      );
      const field = within(dialog).getByRole("combobox", { name: "Skill" });
      await waitFor(() => expect(field).toBeEnabled());
      await user.click(field);
      await user.click(screen.getByRole("option", { name: "Docker" }));

      await user.click(within(dialog).getByRole("button", { name: "Cancel" }));
      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
      await user.click(screen.getByRole("button", { name: "ADD SKILL" }));

      const reopened = await screen.findByRole("dialog", { name: "Add skill" });
      expect(within(reopened).getByRole("combobox", { name: "Skill" })).toHaveTextContent("");
      expect(within(reopened).getByRole("button", { name: "Add" })).toBeDisabled();
    });
  });

  describe("Update skill", () => {
    const typescript = sampleSkills[1]!;

    async function openUpdateModal(options: RenderWithProvidersOptions) {
      const view = setup(options);
      await skillsLoaded();
      await view.user.click(screen.getByRole("button", { name: /TypeScript/ }));
      const dialog = await screen.findByRole("dialog", { name: "Update skill" });
      return { ...view, dialog };
    }

    it("shows the current skill in a disabled field and keeps SAVE disabled until the mastery changes (AC-23, AC-24)", async () => {
      const { dialog } = await openUpdateModal({ mocks: [cvSkillsMock()] });

      const skill = within(dialog).getByRole("combobox", { name: "Skill" });
      expect(skill).toBeDisabled();
      expect(skill).toHaveTextContent("TypeScript");
      expect(within(dialog).getByRole("combobox", { name: /Mastery/ })).toHaveTextContent(
        "Advanced",
      );
      expect(within(dialog).getByRole("button", { name: "Save" })).toBeDisabled();
    });

    it("saves the new mastery and shows it in the list after the backend answered (AC-25)", async () => {
      const { user, dialog } = await openUpdateModal({
        mocks: [cvSkillsMock(), updateCvSkillMock(typescript, "EXPERT")],
      });
      await user.click(within(dialog).getByRole("combobox", { name: /Mastery/ }));
      await user.click(screen.getByRole("option", { name: "Expert" }));

      await user.click(within(dialog).getByRole("button", { name: "Save" }));

      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
      expect(
        await screen.findByRole("button", { name: "TypeScript Mastery: Expert" }),
      ).toBeInTheDocument();
    });

    it("keeps SAVE disabled when the mastery is changed back to the saved one", async () => {
      const { user, dialog } = await openUpdateModal({ mocks: [cvSkillsMock()] });
      const mastery = within(dialog).getByRole("combobox", { name: /Mastery/ });

      await user.click(mastery);
      await user.click(screen.getByRole("option", { name: "Expert" }));
      expect(within(dialog).getByRole("button", { name: "Save" })).toBeEnabled();
      await user.click(mastery);
      await user.click(screen.getByRole("option", { name: "Advanced" }));

      expect(within(dialog).getByRole("button", { name: "Save" })).toBeDisabled();
    });

    it("keeps the chosen mastery and the old list when the request fails (AC-42, AC-43)", async () => {
      const { user, dialog } = await openUpdateModal({
        mocks: [cvSkillsMock(), updateCvSkillNetworkErrorMock(typescript.id, "EXPERT")],
      });
      const mastery = within(dialog).getByRole("combobox", { name: /Mastery/ });
      await user.click(mastery);
      await user.click(screen.getByRole("option", { name: "Expert" }));

      await user.click(within(dialog).getByRole("button", { name: "Save" }));

      expect(await within(dialog).findByRole("alert")).toHaveTextContent("Something went wrong");
      expect(mastery).toHaveTextContent("Expert");
      // The open modal hides the page from the accessibility tree, so the list is read with `hidden`.
      expect(
        screen.getByRole("button", { name: "TypeScript Mastery: Advanced", hidden: true }),
      ).toBeInTheDocument();
    });
  });

  describe("Remove skills", () => {
    const ids = ["link-1", "link-3"];

    async function enterSelectionMode(options: RenderWithProvidersOptions) {
      const view = setup(options);
      await skillsLoaded();
      await view.user.click(screen.getByRole("button", { name: "REMOVE SKILLS" }));
      return view;
    }

    async function chooseTwo(user: Awaited<ReturnType<typeof enterSelectionMode>>["user"]) {
      await user.click(screen.getByRole("button", { name: /JavaScript/ }));
      await user.click(screen.getByRole("button", { name: /React/ }));
    }

    it("starts the selection mode with REMOVE disabled and no count (AC-27, AC-31)", async () => {
      await enterSelectionMode({ mocks: [cvSkillsMock()] });

      expect(screen.getByRole("button", { name: "Remove" })).toBeDisabled();
      expect(screen.getByRole("button", { name: "Cancel" })).toBeEnabled();
      expect(screen.queryByRole("button", { name: "ADD SKILL" })).not.toBeInTheDocument();
    });

    it("counts the chosen skills and updates the count at once (AC-28, AC-30)", async () => {
      const { user } = await enterSelectionMode({ mocks: [cvSkillsMock()] });

      await chooseTwo(user);
      expect(screen.getByRole("button", { name: "Remove 2" })).toBeEnabled();

      await user.click(screen.getByRole("button", { name: /React/ }));
      expect(screen.getByRole("button", { name: "Remove 1" })).toBeEnabled();
    });

    it("does not open the update modal in the selection mode", async () => {
      const { user } = await enterSelectionMode({ mocks: [cvSkillsMock()] });

      await user.click(screen.getByRole("button", { name: /TypeScript/ }));

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("leaves the selection mode with CANCEL and clears the choice (AC-27)", async () => {
      const { user } = await enterSelectionMode({ mocks: [cvSkillsMock()] });
      await chooseTwo(user);

      await user.click(screen.getByRole("button", { name: "Cancel" }));
      await user.click(screen.getByRole("button", { name: "REMOVE SKILLS" }));

      expect(screen.getByRole("button", { name: "Remove" })).toBeDisabled();
      expect(screen.getByRole("button", { name: /React/ })).toHaveAttribute(
        "aria-pressed",
        "false",
      );
    });

    it("leaves the selection mode with Escape", async () => {
      const { user } = await enterSelectionMode({ mocks: [cvSkillsMock()] });

      await user.keyboard("{Escape}");

      expect(screen.getByRole("button", { name: "ADD SKILL" })).toBeInTheDocument();
    });

    it("asks with the number of chosen skills and removes nothing on CANCEL (AC-32)", async () => {
      const { user } = await enterSelectionMode({ mocks: [cvSkillsMock()] });
      await chooseTwo(user);

      await user.click(screen.getByRole("button", { name: "Remove 2" }));
      const dialog = await screen.findByRole("alertdialog", { name: "Remove skills" });
      expect(dialog).toHaveTextContent("Are you sure you want to remove 2 skills?");
      await user.click(within(dialog).getByRole("button", { name: "Cancel" }));

      await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
      // The choice stays, so the user can try again.
      expect(screen.getByRole("button", { name: "Remove 2" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /JavaScript/ })).toBeInTheDocument();
    });

    it("removes the chosen skills after the backend answered, then leaves the mode (AC-34, AC-35)", async () => {
      const remaining = sampleSkills.filter((skill) => !ids.includes(skill.id));
      const { user } = await enterSelectionMode({
        mocks: [cvSkillsMock(), removeCvSkillsMock(ids), cvSkillsMock(remaining)],
      });
      await chooseTwo(user);
      await user.click(screen.getByRole("button", { name: "Remove 2" }));
      const dialog = await screen.findByRole("alertdialog");

      await user.click(within(dialog).getByRole("button", { name: "Confirm" }));

      // The open modal hides the page from the accessibility tree: wait until it is gone, then read the list.
      await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
      await waitFor(() =>
        expect(screen.queryByRole("button", { name: /JavaScript/ })).not.toBeInTheDocument(),
      );
      expect(screen.queryByRole("region", { name: "Frontend" })).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: /TypeScript/ })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "ADD SKILL" })).toBeInTheDocument();
    });

    it("keeps every skill and the choice when the request fails (AC-43)", async () => {
      const { user } = await enterSelectionMode({
        mocks: [cvSkillsMock(), removeCvSkillsNetworkErrorMock(ids)],
      });
      await chooseTwo(user);
      await user.click(screen.getByRole("button", { name: "Remove 2" }));
      const dialog = await screen.findByRole("alertdialog");

      await user.click(within(dialog).getByRole("button", { name: "Confirm" }));

      expect(await screen.findByText("Could not remove the skills")).toBeInTheDocument();
      expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: /JavaScript/ })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Remove 2" })).toBeInTheDocument();
    });

    it("loads the list again and leaves the mode when a skill is already gone (NOT_FOUND)", async () => {
      const { user } = await enterSelectionMode({
        mocks: [
          cvSkillsMock(),
          removeCvSkillsRefusedMock(ids, "NOT_FOUND"),
          cvSkillsMock(sampleSkills.slice(1, 2)),
        ],
      });
      await chooseTwo(user);
      await user.click(screen.getByRole("button", { name: "Remove 2" }));
      const dialog = await screen.findByRole("alertdialog");

      await user.click(within(dialog).getByRole("button", { name: "Confirm" }));

      expect(await screen.findByText(/not in the CV any more/)).toBeInTheDocument();
      await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
      await waitFor(() =>
        expect(screen.queryByRole("button", { name: /JavaScript/ })).not.toBeInTheDocument(),
      );
      expect(screen.getByRole("button", { name: "ADD SKILL" })).toBeInTheDocument();
    });
  });
});
