import { describe, expect, it, vi } from "vitest";
import { renderWithProviders, screen } from "@/shared/testing";
import { ProfileAvatar } from "./ProfileAvatar";

const NAME = "Emma Employee";
const REMOVE = "Remove avatar";
const PHOTO = "/api/users/10/avatar?v=1";

describe("ProfileAvatar", () => {
  it("shows the photo, named by the user's name", () => {
    renderWithProviders(<ProfileAvatar name={NAME} src={PHOTO} removeLabel={REMOVE} />);

    const avatar = screen.getByRole("img", { name: NAME });
    expect(avatar.querySelector("img")).toHaveAttribute("src", PHOTO);
  });

  it("has no Remove button without onRemove", () => {
    renderWithProviders(<ProfileAvatar name={NAME} src={PHOTO} removeLabel={REMOVE} />);

    expect(screen.queryByRole("button", { name: REMOVE })).not.toBeInTheDocument();
  });

  it("calls onRemove from the Remove button, also by keyboard", async () => {
    const onRemove = vi.fn();
    const { user } = renderWithProviders(
      <ProfileAvatar name={NAME} src={PHOTO} removeLabel={REMOVE} onRemove={onRemove} />,
    );

    await user.click(screen.getByRole("button", { name: REMOVE }));
    await user.keyboard("{Enter}");

    expect(onRemove).toHaveBeenCalledTimes(2);
  });

  it("cannot remove while an action runs", async () => {
    const onRemove = vi.fn();
    const { user } = renderWithProviders(
      <ProfileAvatar name={NAME} src={PHOTO} removeLabel={REMOVE} onRemove={onRemove} disabled />,
    );

    const button = screen.getByRole("button", { name: REMOVE });
    expect(button).toBeDisabled();
    await user.click(button);
    expect(onRemove).not.toHaveBeenCalled();
  });
});
