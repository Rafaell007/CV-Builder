import { describe, expect, it, vi } from "vitest";
import { renderWithProviders, screen } from "@/shared/testing";
import { Pagination } from "./Pagination";

describe("Pagination", () => {
  it("renders nothing when all rows fit on one page", () => {
    renderWithProviders(<Pagination page={1} total={10} onPageChange={vi.fn()} />);

    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("uses the page size 10 by default", () => {
    renderWithProviders(<Pagination page={1} total={11} onPageChange={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Page 2" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Page 3" })).not.toBeInTheDocument();
  });

  it("marks the current page", () => {
    renderWithProviders(<Pagination page={2} total={30} onPageChange={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Page 2" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("button", { name: "Page 1" })).not.toHaveAttribute("aria-current");
  });

  it("calls onPageChange with the clicked page", async () => {
    const onPageChange = vi.fn();
    const { user } = renderWithProviders(
      <Pagination page={1} total={30} onPageChange={onPageChange} />,
    );

    await user.click(screen.getByRole("button", { name: "Page 3" }));

    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it("moves with the previous and next buttons", async () => {
    const onPageChange = vi.fn();
    const { user } = renderWithProviders(
      <Pagination page={2} total={30} onPageChange={onPageChange} />,
    );

    await user.click(screen.getByRole("button", { name: "Next page" }));
    await user.click(screen.getByRole("button", { name: "Previous page" }));

    expect(onPageChange).toHaveBeenNthCalledWith(1, 3);
    expect(onPageChange).toHaveBeenNthCalledWith(2, 1);
  });

  it("disables previous on the first page and next on the last page", () => {
    const { rerender } = renderWithProviders(
      <Pagination page={1} total={30} onPageChange={vi.fn()} />,
    );
    expect(screen.getByRole("button", { name: "Previous page" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Next page" })).toBeEnabled();

    rerender(<Pagination page={3} total={30} onPageChange={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Next page" })).toBeDisabled();
  });

  it("hides the pages between the first, the current and the last page", () => {
    renderWithProviders(<Pagination page={5} total={100} onPageChange={vi.fn()} />);

    expect(screen.queryByRole("button", { name: "Page 2" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Page 4" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Page 10" })).toBeInTheDocument();
  });

  it("uses the given labels", () => {
    renderWithProviders(
      <Pagination
        page={1}
        total={30}
        onPageChange={vi.fn()}
        labels={{ navigation: "Paginacja", next: "Dalej", page: (n) => `Strona ${n}` }}
      />,
    );

    expect(screen.getByRole("navigation", { name: "Paginacja" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Dalej" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Strona 2" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Previous page" })).toBeInTheDocument();
  });
});
