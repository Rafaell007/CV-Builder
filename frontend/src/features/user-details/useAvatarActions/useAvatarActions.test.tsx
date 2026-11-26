import { act, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/shared/testing";
import { useAvatarActions } from "./useAvatarActions";

// The requests, their outcomes and the cache are tested in useUploadAvatar and useRemoveAvatar; here they are stubs.
const avatar = vi.hoisted(() => ({
  upload: vi.fn(),
  remove: vi.fn(),
  uploadPending: false,
  removePending: false,
}));
vi.mock("../useUploadAvatar", () => ({
  useUploadAvatar: () => ({ pending: avatar.uploadPending, upload: avatar.upload }),
}));
vi.mock("../useRemoveAvatar", () => ({
  useRemoveAvatar: () => ({ pending: avatar.removePending, remove: avatar.remove }),
}));

beforeEach(() => {
  avatar.upload.mockReset();
  avatar.remove.mockReset();
  avatar.uploadPending = false;
  avatar.removePending = false;
});

function setup(locale: "en" | "pl" = "en") {
  let current!: ReturnType<typeof useAvatarActions>;
  function Probe(): ReactNode {
    current = useAvatarActions("7");
    return null;
  }
  renderWithProviders(<Probe />, { locale });
  return {
    hook: () => current,
    upload: (file: File) => act(() => current.upload(file)),
    remove: () => act(() => current.remove()),
  };
}

const png = () => new File([new Uint8Array(10)], "photo.png", { type: "image/png" });

describe("useAvatarActions", () => {
  it("uploads the chosen file and says so", async () => {
    avatar.upload.mockResolvedValue("uploaded");
    const { upload } = setup();
    const file = png();

    await upload(file);

    expect(avatar.upload).toHaveBeenCalledWith(file);
    expect(await screen.findByText("Avatar updated")).toBeInTheDocument();
  });

  it.each([
    ["wrongType", "Only png, jpg or gif images are allowed."],
    ["tooLarge", "File size must not exceed 5 MB."],
    ["forbidden", "You do not have permission to do this."],
    ["failed", "Something went wrong. Try again."],
  ])("shows the error toast for a failed upload (%s)", async (outcome, reason) => {
    avatar.upload.mockResolvedValue(outcome);
    const { upload } = setup();

    await upload(png());

    expect(await screen.findByText("Failed to upload avatar")).toBeInTheDocument();
    expect(screen.getByText(reason)).toBeInTheDocument();
  });

  it("removes the avatar and says so", async () => {
    avatar.remove.mockResolvedValue("removed");
    const { remove } = setup();

    await remove();

    expect(avatar.remove).toHaveBeenCalledOnce();
    expect(await screen.findByText("Avatar removed")).toBeInTheDocument();
  });

  it.each([
    ["forbidden", "You do not have permission to do this."],
    ["failed", "Something went wrong. Try again."],
  ])("shows the error toast for a failed removal (%s)", async (outcome, reason) => {
    avatar.remove.mockResolvedValue(outcome);
    const { remove } = setup();

    await remove();

    expect(await screen.findByText("Failed to remove avatar")).toBeInTheDocument();
    expect(screen.getByText(reason)).toBeInTheDocument();
  });

  it("starts one action at a time", async () => {
    let finish!: (outcome: string) => void;
    avatar.upload.mockReturnValue(new Promise((resolve) => (finish = resolve)));
    avatar.remove.mockResolvedValue("removed");
    const { hook } = setup();

    let first!: Promise<void>;
    act(() => {
      first = hook().upload(png());
    });
    await act(() => hook().remove());
    expect(avatar.remove).not.toHaveBeenCalled();

    await act(async () => {
      finish("uploaded");
      await first;
    });
    await act(() => hook().remove());
    expect(avatar.remove).toHaveBeenCalledOnce();
  });

  it.each([
    ["an upload", { uploadPending: true }],
    ["a removal", { removePending: true }],
  ])("is busy while %s runs", (_, pending) => {
    Object.assign(avatar, pending);
    const { hook } = setup();

    expect(hook().busy).toBe(true);
  });

  it("speaks the language of the page", async () => {
    avatar.upload.mockResolvedValue("tooLarge");
    const { upload } = setup("pl");

    await upload(png());

    expect(await screen.findByText("Plik nie może być większy niż 5 MB.")).toBeInTheDocument();
  });
});
