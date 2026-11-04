import { renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useReturnFocus } from "./useReturnFocus";

function addButton() {
  const button = document.createElement("button");
  document.body.append(button);
  return button;
}

describe("useReturnFocus", () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it("focuses the element that was focused when the dialog opened", () => {
    const opener = addButton();
    const inside = addButton();
    const { result } = renderHook(() => useReturnFocus());
    const preventDefault = vi.fn();

    opener.focus();
    result.current.onOpenAutoFocus();
    inside.focus();
    result.current.onCloseAutoFocus({ preventDefault });

    expect(opener).toHaveFocus();
    expect(preventDefault).toHaveBeenCalledOnce();
  });

  it("keeps the default when the opener was removed", () => {
    const opener = addButton();
    const { result } = renderHook(() => useReturnFocus());
    const preventDefault = vi.fn();

    opener.focus();
    result.current.onOpenAutoFocus();
    opener.remove();
    result.current.onCloseAutoFocus({ preventDefault });

    expect(preventDefault).not.toHaveBeenCalled();
  });
});
