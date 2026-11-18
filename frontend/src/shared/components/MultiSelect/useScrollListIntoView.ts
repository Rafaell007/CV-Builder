import { useEffect } from "react";
import { findScrollParent } from "./utils";

// An open list hangs under the field and can reach below the visible part of a scrolling container (a modal).
// On open the container scrolls just enough to show the whole list; on close it goes back to where it was.
export function useScrollListIntoView(isOpen: boolean, menuId: string) {
  useEffect(() => {
    if (!isOpen) return;
    const list = document.getElementById(menuId);
    if (!list) return;
    const container = findScrollParent(list);
    const initialTop = container?.scrollTop ?? 0;
    const behavior = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
      ? "auto"
      : "smooth";

    list.scrollIntoView?.({ block: "nearest", behavior });
    return () => container?.scrollTo?.({ top: initialTop, behavior });
  }, [isOpen, menuId]);
}
