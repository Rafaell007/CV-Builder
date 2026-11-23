import { useEffect, useRef, useState, type KeyboardEvent, type RefObject } from "react";

/** The CSS of the text reads this attribute: while it is set, the text shows in full. */
const EXPANDED_ATTRIBUTE = "data-expanded";

export interface UseClampedTextResult {
  ref: RefObject<HTMLParagraphElement | null>;
  /** True while the user shows the full text. */
  expanded: boolean;
  /** True only when the CSS cuts the text now. Nothing to show or hide means nothing to click. */
  toggleable: boolean;
  toggle: () => void;
  onKeyDown: (event: KeyboardEvent<HTMLElement>) => void;
}

/**
 * Tells whether the CSS cuts a text (a line clamp), and holds the expanded state.
 * The text is measured in its cut form, also while it is expanded, so a wider screen that needs no cut
 * makes the text not clickable again.
 * @param text The shown text. A new text is measured again.
 */
export function useClampedText(text: string): UseClampedTextResult {
  const ref = useRef<HTMLParagraphElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [clamped, setClamped] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const measure = () => {
      // Remove the attribute for the measurement and set it back at once, so nothing is painted in between.
      const wasExpanded = element.hasAttribute(EXPANDED_ATTRIBUTE);
      element.removeAttribute(EXPANDED_ATTRIBUTE);
      setClamped(element.scrollHeight > element.clientHeight);
      if (wasExpanded) element.setAttribute(EXPANDED_ATTRIBUTE, "");
    };

    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [text]);

  const toggle = () => setExpanded((value) => !value);

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      toggle();
    }
  };

  return { ref, expanded, toggleable: clamped, toggle, onKeyDown };
}
