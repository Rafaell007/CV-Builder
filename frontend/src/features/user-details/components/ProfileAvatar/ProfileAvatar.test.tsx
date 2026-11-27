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

describe("ProfileAvatar focus", () => {
  it("moves focus to the photo when the focused Remove button goes away", () => {
    const { rerender } = renderWithProviders(
      <ProfileAvatar name={NAME} src={PHOTO} removeLabel={REMOVE} onRemove={vi.fn()} />,
    );
    screen.getByRole("button", { name: REMOVE }).focus();

    rerender(<ProfileAvatar name={NAME} src={null} removeLabel={REMOVE} />);

    expect(screen.getByRole("img", { name: NAME }).parentElement).toHaveFocus();
  });

  it("keeps focus where it is when the button goes away without focus", () => {
    const { rerender } = renderWithProviders(
      <>
        <button type="button">Elsewhere</button>
        <ProfileAvatar name={NAME} src={PHOTO} removeLabel={REMOVE} onRemove={vi.fn()} />
      </>,
    );
    screen.getByRole("button", { name: "Elsewhere" }).focus();

    rerender(
      <>
        <button type="button">Elsewhere</button>
        <ProfileAvatar name={NAME} src={null} removeLabel={REMOVE} />
      </>,
    );

    expect(screen.getByRole("button", { name: "Elsewhere" })).toHaveFocus();
  });

  it("keeps focus on the button while it stays (e.g. disabled during the request)", () => {
    const { rerender } = renderWithProviders(
      <ProfileAvatar name={NAME} src={PHOTO} removeLabel={REMOVE} onRemove={vi.fn()} />,
    );
    const button = screen.getByRole("button", { name: REMOVE });
    button.focus();

    rerender(
      <ProfileAvatar
        name={NAME}
        src={PHOTO}
        removeLabel={REMOVE}
        onRemove={vi.fn()}
        disabled={false}
      />,
    );

    expect(button).toHaveFocus();
  });
});
