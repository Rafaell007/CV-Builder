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

  // Safari and Firefox on macOS do not focus a button when it is clicked, so the opener is then not the active
  // element and `document.activeElement` is the page body. Focusing the body would lose the user's place.
  it("keeps the default when nothing was focused when the dialog opened", () => {
    const inside = addButton();
    const { result } = renderHook(() => useReturnFocus());
    const preventDefault = vi.fn();

    expect(document.body).toHaveFocus();
    result.current.onOpenAutoFocus();
    inside.focus();
    result.current.onCloseAutoFocus({ preventDefault });

    expect(preventDefault).not.toHaveBeenCalled();
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
