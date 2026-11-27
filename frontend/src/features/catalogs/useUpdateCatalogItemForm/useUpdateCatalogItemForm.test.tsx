import { CombinedGraphQLErrors } from "@apollo/client";
import { act, screen } from "@testing-library/react";
import type { BaseSyntheticEvent, ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/shared/testing";
import type { CatalogItem } from "../catalogs.types";
import { useUpdateCatalogItemForm } from "./useUpdateCatalogItemForm";

const event = { preventDefault: () => {} } as BaseSyntheticEvent;
const engineering: CatalogItem = { id: "7", name: "Engineering" };

function setup(update: (id: string, name: string) => Promise<CatalogItem>) {
  let current!: ReturnType<typeof useUpdateCatalogItemForm>;
  function Probe(): ReactNode {
    current = useUpdateCatalogItemForm("catalogs.departments", update);
    return null;
  }
  renderWithProviders(<Probe />);
  const submitName = async (name: string) => {
    act(() => current.form.setValue("name", name, { shouldValidate: true, shouldDirty: true }));
    await act(() => current.submit(event));
  };
  return { result: () => current, submitName };
}

describe("useUpdateCatalogItemForm", () => {
  it("opens the form filled with the name of the item, unchanged", () => {
    const { result } = setup(vi.fn());

    act(() => result().open(engineering));

    expect(result().isOpen).toBe(true);
    expect(result().form.getValues("name")).toBe("Engineering");
    expect(result().form.formState.isDirty).toBe(false);
  });

  it("sends the id and the trimmed name, closes and shows a toast with the saved name", async () => {
    const update = vi.fn().mockResolvedValue({ id: "7", name: "R&D" });
    const { result, submitName } = setup(update);
    act(() => result().open(engineering));

    await submitName(" R&D ");

    expect(update).toHaveBeenCalledExactlyOnceWith("7", "R&D");
    expect(result().isOpen).toBe(false);
    expect(await screen.findByText("R&D was saved.")).toBeInTheDocument();
  });

  it("stays open and keeps the typed name when the name is taken", async () => {
    const taken = new CombinedGraphQLErrors({
      errors: [{ message: "Exists", extensions: { code: "CONFLICT" } }],
    });
    const { result, submitName } = setup(vi.fn().mockRejectedValue(taken));
    act(() => result().open(engineering));

    await submitName("Finance");

    expect(result().isOpen).toBe(true);
    expect(result().form.getValues("name")).toBe("Finance");
    expect(result().form.getFieldState("name").error?.message).toBe("Department already exists");
    expect(screen.queryByText(/was saved/)).not.toBeInTheDocument();
  });

  it("stays open and shows the general message for another error", async () => {
    const { result, submitName } = setup(vi.fn().mockRejectedValue(new Error("Failed to fetch")));
    act(() => result().open(engineering));

    await submitName("Finance");

    expect(result().isOpen).toBe(true);
    expect(result().form.getValues("name")).toBe("Finance");
    expect(result().failed).toBe(true);
  });
});
