import { describe, expect, it, vi } from "vitest";
import { renderWithProviders, screen, within } from "@/shared/testing";
import { sampleSkills } from "../cvSkills.mocks";
import { groupSkillsByCategory } from "../utils";
import { SkillGroups, type SkillGroupsProps } from "./SkillGroups";

function setup(props: Partial<SkillGroupsProps> = {}, locale?: "pl") {
  const onOpen = vi.fn();
  const onToggle = vi.fn();
  const view = renderWithProviders(
    <SkillGroups
      groups={groupSkillsByCategory(sampleSkills)}
      selecting={false}
      selectedIds={[]}
      onOpen={onOpen}
      onToggle={onToggle}
      {...props}
    />,
    locale === undefined ? {} : { locale },
  );
  return { ...view, onOpen, onToggle };
}

describe("SkillGroups", () => {
  it("shows each category as a heading above its own skills (AC-10)", () => {
    setup();

    const languages = screen.getByRole("region", { name: "Programming languages" });
    expect(within(languages).getAllByRole("button")).toHaveLength(2);
    expect(within(languages).getByRole("button", { name: /JavaScript/ })).toBeInTheDocument();
    const frontend = screen.getByRole("region", { name: "Frontend" });
    expect(within(frontend).getAllByRole("button")).toHaveLength(1);
    expect(within(frontend).getByRole("button", { name: /React/ })).toBeInTheDocument();
  });

  it("shows no category for no skills (AC-11)", () => {
    setup({ groups: [] });

    expect(screen.queryByRole("heading")).not.toBeInTheDocument();
  });

  it("writes the mastery level in the name of the skill for screen readers (AC-12)", () => {
    setup();

    expect(screen.getByRole("button", { name: "JavaScript Mastery: Expert" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "React Mastery: Intermediate" })).toBeInTheDocument();
  });

  it("fills the bar by level and hides it from screen readers", () => {
    setup();

    const bar = (name: RegExp) =>
      screen.getByRole("button", { name }).querySelector<HTMLElement>("[aria-hidden] > span");
    expect(bar(/JavaScript/)).toHaveStyle({ width: "100%" });
    expect(bar(/TypeScript/)).toHaveStyle({ width: "80%" });
    expect(bar(/React/)).toHaveStyle({ width: "60%" });
  });

  it("opens the skill on a press, outside the selection mode (AC-21)", async () => {
    const { user, onOpen, onToggle } = setup();

    await user.click(screen.getByRole("button", { name: /TypeScript/ }));

    expect(onOpen).toHaveBeenCalledWith(sampleSkills[1]);
    expect(onToggle).not.toHaveBeenCalled();
  });

  it("is not a toggle button outside the selection mode", () => {
    setup();

    expect(screen.getByRole("button", { name: /TypeScript/ })).not.toHaveAttribute("aria-pressed");
  });

  it("chooses the skill by the id of its link in the selection mode (AC-28)", async () => {
    const { user, onOpen, onToggle } = setup({ selecting: true });

    await user.click(screen.getByRole("button", { name: /TypeScript/ }));

    expect(onToggle).toHaveBeenCalledWith("link-2");
    expect(onOpen).not.toHaveBeenCalled();
  });

  it("exposes the chosen state to assistive technology (AC-29)", () => {
    setup({ selecting: true, selectedIds: ["link-2"] });

    expect(screen.getByRole("button", { name: /TypeScript/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: /JavaScript/ })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("works with the keyboard", async () => {
    const { user, onOpen } = setup();

    await user.tab();
    await user.keyboard("{Enter}");

    expect(onOpen).toHaveBeenCalledWith(sampleSkills[0]);
  });

  it("shows the levels in Polish", () => {
    setup({}, "pl");

    expect(screen.getByRole("button", { name: "JavaScript Poziom: Ekspert" })).toBeInTheDocument();
  });
});
