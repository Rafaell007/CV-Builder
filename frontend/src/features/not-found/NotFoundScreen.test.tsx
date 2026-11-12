import { describe, expect, it, vi } from "vitest";
import { renderWithProviders, screen } from "@/shared/testing";
import { NotFoundScreen } from "./NotFoundScreen";

const goBack = vi.fn();
vi.mock("./useGoBack", () => ({ useGoBack: () => goBack }));

const props = {
  title: "Hmm...",
  messageLine1: "This doesn’t seem to be the page you were looking for.",
  messageLine2: "Let’s get you back on track.",
  goBackLabel: "Go back",
};

describe("NotFoundScreen", () => {
  it("shows the heading and both message lines", () => {
    renderWithProviders(<NotFoundScreen {...props} />);

    expect(screen.getByRole("heading", { level: 1, name: "Hmm..." })).toBeInTheDocument();
    expect(screen.getByText(/looking for/)).toHaveTextContent(
      `${props.messageLine1}${props.messageLine2}`,
    );
  });

  it("goes back when GO BACK is clicked", async () => {
    const { user } = renderWithProviders(<NotFoundScreen {...props} />);

    await user.click(screen.getByRole("button", { name: "Go back" }));

    expect(goBack).toHaveBeenCalledTimes(1);
  });

  it("is not announced as an alert", () => {
    renderWithProviders(<NotFoundScreen {...props} />);

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
