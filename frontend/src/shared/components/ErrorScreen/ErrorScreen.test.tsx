import { describe, expect, it } from "vitest";
import { renderWithProviders, screen } from "@/shared/testing";
import { ErrorScreen } from "./ErrorScreen";

const props = { title: "Oops", message: "Something went wrong." };

describe("ErrorScreen", () => {
  it("shows the heading, the message and the action", () => {
    renderWithProviders(
      <ErrorScreen {...props}>
        <button type="button">Retry</button>
      </ErrorScreen>,
    );

    expect(screen.getByRole("heading", { level: 1, name: "Oops" })).toBeInTheDocument();
    expect(screen.getByText("Something went wrong.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
  });

  it("is not an alert unless asked to announce", () => {
    const { rerender } = renderWithProviders(<ErrorScreen {...props} />);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();

    rerender(<ErrorScreen {...props} announce />);

    expect(screen.getByRole("alert")).toHaveTextContent("OopsSomething went wrong.");
  });
});
