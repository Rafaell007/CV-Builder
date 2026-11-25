import { describe, expect, it, vi } from "vitest";
import { renderWithProviders, screen } from "@/shared/testing";
import type { UseCatalogOptionsResult } from "../catalogOptions.types";
import { CatalogSelect, type CatalogSelectProps } from "./CatalogSelect";

const loaded: UseCatalogOptionsResult = {
  options: [
    { id: "d2", name: ".NET" },
    { id: "d1", name: "React" },
  ],
  loading: false,
  failed: false,
  retry: vi.fn(),
};

function renderSelect(props: Partial<CatalogSelectProps> = {}) {
  return renderWithProviders(
    <CatalogSelect
      label="Department"
      catalog={loaded}
      value=""
      onValueChange={vi.fn()}
      loadingText="Loading…"
      failedText="Failed to load departments"
      retryLabel="Retry"
      {...props}
    />,
  );
}

describe("CatalogSelect", () => {
  it("lists the catalog items and reports the chosen id", async () => {
    const onValueChange = vi.fn();
    const { user } = renderSelect({ onValueChange });

    await user.click(screen.getByRole("combobox", { name: "Department" }));
    await user.click(screen.getByRole("option", { name: "React" }));

    expect(onValueChange).toHaveBeenCalledWith("d1");
  });

  it("is disabled with a helper text while the options load", () => {
    renderSelect({ catalog: { ...loaded, options: undefined, loading: true } });

    const select = screen.getByRole("combobox", { name: "Department" });
    expect(select).toBeDisabled();
    expect(select).toHaveAccessibleDescription("Loading…");
  });

  it("shows the load error instead of the field error, and Retry loads again", async () => {
    const retry = vi.fn();
    const { user } = renderSelect({
      catalog: { options: undefined, loading: false, failed: true, retry },
      error: "Choose a department",
    });

    const select = screen.getByRole("combobox", { name: "Department" });
    expect(select).toBeDisabled();
    expect(select).toHaveAccessibleDescription("Failed to load departments");
    await user.click(screen.getByRole("button", { name: "Retry" }));

    expect(retry).toHaveBeenCalledTimes(1);
  });

  it("shows the field error when the options loaded", () => {
    renderSelect({ error: "Choose a department" });

    expect(screen.getByRole("combobox", { name: "Department" })).toHaveAccessibleDescription(
      "Choose a department",
    );
  });

  it("passes read-only to the select", () => {
    renderSelect({ value: "d1", readOnly: true });

    const select = screen.getByRole("combobox", { name: "Department" });
    expect(select).toHaveAttribute("aria-readonly", "true");
    expect(select).toHaveTextContent("React");
  });
});
