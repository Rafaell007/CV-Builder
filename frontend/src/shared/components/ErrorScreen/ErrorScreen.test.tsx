import { describe, expect, it, vi } from "vitest";
import { renderWithProviders, screen } from "@/shared/testing";
import { ErrorScreen } from "./ErrorScreen";

const props = {
  title: "Oops",
  message: "Something went wrong. Please try again or go back.",
};

describe("ErrorScreen", () => {
  it("shows the heading and the message", () => {
    renderWithProviders(<ErrorScreen {...props} />);

    expect(screen.getByRole("heading", { level: 1, name: "Oops" })).toBeInTheDocument();
    expect(screen.getByText(props.message)).toBeInTheDocument();
  });

  it("has no alert and no button by default", () => {
    renderWithProviders(<ErrorScreen {...props} />);

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("announces the heading and the message as an alert when asked", () => {
    renderWithProviders(<ErrorScreen {...props} announce />);

    expect(screen.getByRole("alert")).toHaveTextContent(`Oops${props.message}`);
  });

  it("calls the action when its button is clicked", async () => {
    const onClick = vi.fn();
    const { user } = renderWithProviders(
      <ErrorScreen {...props} action={{ label: "Retry", onClick }} />,
    );

    await user.click(screen.getByRole("button", { name: "Retry" }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
