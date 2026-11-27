import { describe, expect, it, vi } from "vitest";
import { renderWithProviders, screen } from "@/shared/testing";
import { AvatarUpload } from "./AvatarUpload";

const LABEL = "Upload avatar image";
const HINT = "png, jpg or gif no more than 5MB";

function setup(props: { disabled?: boolean } = {}) {
  const onFileSelect = vi.fn();
  const view = renderWithProviders(
    <AvatarUpload label={LABEL} hint={HINT} onFileSelect={onFileSelect} {...props} />,
  );
  // A file input has no ARIA role, so it is found by its label.
  const input = screen.getByLabelText(LABEL) as HTMLInputElement;
  return { ...view, input, onFileSelect };
}

const png = () => new File([new Uint8Array(10)], "photo.png", { type: "image/png" });

describe("AvatarUpload", () => {
  it("is a file input named by the visible label and described by the hint", () => {
    const { input } = setup();

    expect(input).toHaveAttribute("type", "file");
    expect(input).toHaveAccessibleDescription(HINT);
    expect(screen.getByText(HINT)).toBeVisible();
  });

  it("offers only PNG, JPG and GIF images in the picker", () => {
    const { input } = setup();

    expect(input).toHaveAttribute("accept", "image/png,image/jpeg,image/gif");
  });

  it("passes the chosen file on and clears the input, so the same file can be chosen again", async () => {
    const { user, input, onFileSelect } = setup();
    const file = png();

    await user.upload(input, file);
    expect(onFileSelect).toHaveBeenLastCalledWith(file);
    expect(input.value).toBe("");

    await user.upload(input, file);
    expect(onFileSelect).toHaveBeenCalledTimes(2);
  });

  it("can be reached with the keyboard", async () => {
    const { user, input } = setup();

    await user.tab();

    expect(input).toHaveFocus();
  });

  it("cannot be used while disabled", async () => {
    const { user, input, onFileSelect } = setup({ disabled: true });

    await user.upload(input, png());

    expect(input).toBeDisabled();
    expect(onFileSelect).not.toHaveBeenCalled();
  });
});
