import { act, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders, screen } from "@/shared/testing";
import { Avatar } from "./Avatar";

describe("Avatar", () => {
  it("shows the image when there is a src", () => {
    const { container } = renderWithProviders(<Avatar name="Jan Kowalski" src="/jan.png" />);

    expect(container.querySelector("img")).toHaveAttribute("src", "/jan.png");
    expect(screen.queryByText("JK")).not.toBeInTheDocument();
  });

  it("shows the initials when there is no src", () => {
    renderWithProviders(<Avatar name="Jan Kowalski" />);

    expect(screen.getByText("JK")).toBeInTheDocument();
  });

  it("shows the initials when the image fails to load", () => {
    const { container } = renderWithProviders(<Avatar name="Jan Kowalski" src="/broken.png" />);

    fireEvent.error(container.querySelector("img") as HTMLImageElement);

    expect(container.querySelector("img")).toBeNull();
    expect(screen.getByText("JK")).toBeInTheDocument();
  });

  it("loads the image again, as a new <img>, when retryImage allows it", async () => {
    const retryImage = vi.fn().mockResolvedValue(true);
    const { container } = renderWithProviders(
      <Avatar name="Jan Kowalski" src="/jan.png" retryImage={retryImage} />,
    );
    const first = container.querySelector("img");

    await act(async () => fireEvent.error(first as HTMLImageElement));

    const second = container.querySelector("img");
    expect(second).toHaveAttribute("src", "/jan.png");
    expect(second).not.toBe(first);
  });

  it("names the picture after the user", () => {
    renderWithProviders(<Avatar name="Jan Kowalski" />);

    expect(screen.getByRole("img", { name: "Jan Kowalski" })).toBeInTheDocument();
  });
});
