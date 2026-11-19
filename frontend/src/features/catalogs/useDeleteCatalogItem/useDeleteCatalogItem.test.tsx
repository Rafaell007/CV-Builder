import { CombinedGraphQLErrors } from "@apollo/client";
import { act, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/shared/testing";
import type { CatalogItem } from "../catalogs.types";
import { useDeleteCatalogItem } from "./useDeleteCatalogItem";

const engineering: CatalogItem = { id: "7", name: "Engineering" };

function setup(remove: (id: string) => Promise<unknown>) {
  let current!: ReturnType<typeof useDeleteCatalogItem>;
  function Probe(): ReactNode {
    current = useDeleteCatalogItem("catalogs.departments", remove);
    return null;
  }
  renderWithProviders(<Probe />);
  return { result: () => current };
}

async function confirm(result: () => ReturnType<typeof useDeleteCatalogItem>) {
  let deleted: boolean | undefined;
  await act(async () => {
    deleted = await result().confirm();
  });
  return deleted;
}

describe("useDeleteCatalogItem", () => {
  it("holds the chosen item until Cancel, without a request", () => {
    const remove = vi.fn();
    const { result } = setup(remove);

    act(() => result().askToDelete(engineering));
    expect(result().item).toEqual(engineering);

    act(() => result().cancel());
    expect(result().item).toBeNull();
    expect(remove).not.toHaveBeenCalled();
  });

  it("does nothing when no item was chosen", async () => {
    const remove = vi.fn();
    const { result } = setup(remove);

    expect(await confirm(result)).toBe(false);
    expect(remove).not.toHaveBeenCalled();
  });

  it("sends the id, closes and resolves true on success", async () => {
    const remove = vi.fn().mockResolvedValue(undefined);
    const { result } = setup(remove);
    act(() => result().askToDelete(engineering));

    expect(await confirm(result)).toBe(true);

    expect(remove).toHaveBeenCalledExactlyOnceWith("7");
    expect(result().item).toBeNull();
    expect(result().pending).toBe(false);
  });

  it("keeps the modal open with the in-use error and resolves false for a CONFLICT", async () => {
    const inUse = new CombinedGraphQLErrors({
      errors: [{ message: "Used by 3 users", extensions: { code: "CONFLICT" } }],
    });
    const { result } = setup(vi.fn().mockRejectedValue(inUse));
    act(() => result().askToDelete(engineering));

    expect(await confirm(result)).toBe(false);

    expect(result().item).toEqual(engineering);
    expect(result().pending).toBe(false);
    expect(result().error).toBe("Department cannot be deleted because it is currently in use");
    expect(screen.queryByText("Used by 3 users")).not.toBeInTheDocument();
    expect(screen.queryByText("Something went wrong. Please try again.")).not.toBeInTheDocument();
  });

  it("clears the in-use error on Cancel and on the next choice, and a retry can succeed", async () => {
    const inUse = new CombinedGraphQLErrors({
      errors: [{ message: "Used", extensions: { code: "CONFLICT" } }],
    });
    const remove = vi.fn().mockRejectedValueOnce(inUse).mockResolvedValue(undefined);
    const { result } = setup(remove);
    act(() => result().askToDelete(engineering));
    await confirm(result);
    expect(result().error).not.toBeNull();

    expect(await confirm(result)).toBe(true);
    expect(result().error).toBeNull();
    expect(result().item).toBeNull();

    act(() => result().askToDelete(engineering));
    remove.mockRejectedValueOnce(inUse);
    await confirm(result);
    act(() => result().cancel());
    expect(result().error).toBeNull();
  });

  it("shows the general failure toast for another error", async () => {
    const { result } = setup(vi.fn().mockRejectedValue(new Error("Failed to fetch")));
    act(() => result().askToDelete(engineering));

    await confirm(result);

    expect(await screen.findByText("Something went wrong. Please try again.")).toBeInTheDocument();
  });

  it("is pending during the request and sends one request for two calls", async () => {
    let finish!: () => void;
    const remove = vi.fn(() => new Promise<void>((resolve) => (finish = resolve)));
    const { result } = setup(remove);
    act(() => result().askToDelete(engineering));

    let first!: Promise<boolean>;
    let second: boolean | undefined;
    await act(async () => {
      first = result().confirm();
      second = await result().confirm();
    });
    expect(result().pending).toBe(true);
    expect(second).toBe(false);

    await act(async () => {
      finish();
      await first;
    });

    expect(remove).toHaveBeenCalledOnce();
    expect(result().pending).toBe(false);
  });
});
