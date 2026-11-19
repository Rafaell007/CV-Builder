import { CombinedGraphQLErrors } from "@apollo/client";
import { act, screen } from "@testing-library/react";
import type { BaseSyntheticEvent, ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/shared/testing";
import type { CatalogItem } from "../catalogs.types";
import { useCreateCatalogItemForm } from "./useCreateCatalogItemForm";

const event = { preventDefault: () => {} } as BaseSyntheticEvent;

function setup(create: (name: string) => Promise<CatalogItem>) {
  let current!: ReturnType<typeof useCreateCatalogItemForm>;
  function Probe(): ReactNode {
    current = useCreateCatalogItemForm("catalogs.departments", create);
    return null;
  }
  renderWithProviders(<Probe />);
  const submitName = async (name: string) => {
    act(() => current.form.setValue("name", name, { shouldValidate: true, shouldDirty: true }));
    await act(() => current.submit(event));
  };
  return { result: () => current, submitName };
}

describe("useCreateCatalogItemForm", () => {
  it("opens an empty form", () => {
    const { result } = setup(vi.fn());

    act(() => result().open());

    expect(result().isOpen).toBe(true);
    expect(result().form.getValues("name")).toBe("");
  });

  it("closes and shows a toast with the saved name after a successful request", async () => {
    const create = vi.fn().mockResolvedValue({ id: "1", name: "Design" });
    const { result, submitName } = setup(create);
    act(() => result().open());

    await submitName(" Design ");

    expect(create).toHaveBeenCalledExactlyOnceWith("Design");
    expect(result().isOpen).toBe(false);
    expect(await screen.findByText("Design was added to the departments.")).toBeInTheDocument();
  });

  it("stays open, keeps the name and shows no toast when the name is taken", async () => {
    const taken = new CombinedGraphQLErrors({
      errors: [{ message: "Exists", extensions: { code: "CONFLICT" } }],
    });
    const { result, submitName } = setup(vi.fn().mockRejectedValue(taken));
    act(() => result().open());

    await submitName("Design");

    expect(result().isOpen).toBe(true);
    expect(result().form.getValues("name")).toBe("Design");
    expect(result().form.getFieldState("name").error?.message).toBe("Department already exists");
    expect(screen.queryByText(/was added/)).not.toBeInTheDocument();
  });

  it("stays open, keeps the name and shows the general message for another error", async () => {
    const { result, submitName } = setup(vi.fn().mockRejectedValue(new Error("Failed to fetch")));
    act(() => result().open());

    await submitName("Design");

    expect(result().isOpen).toBe(true);
    expect(result().form.getValues("name")).toBe("Design");
    expect(result().failed).toBe(true);
  });

  it("is empty again when the modal opens a second time", async () => {
    const { result, submitName } = setup(vi.fn().mockRejectedValue(new Error("Failed to fetch")));
    act(() => result().open());
    await submitName("Design");

    act(() => result().setOpen(false));
    act(() => result().open());

    expect(result().form.getValues("name")).toBe("");
    expect(result().failed).toBe(false);
  });
});
