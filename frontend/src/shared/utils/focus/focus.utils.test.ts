import type { FocusEvent } from "react";
import { describe, expect, it, vi } from "vitest";
import { createFocusLeaveHandler } from "./focus.utils";

function focusEvent(wrapper: HTMLElement, relatedTarget: Element | null) {
  return { currentTarget: wrapper, relatedTarget } as unknown as FocusEvent<HTMLElement>;
}

describe("createFocusLeaveHandler", () => {
  it("calls onBlur when focus goes outside the wrapper", () => {
    const onBlur = vi.fn();
    const wrapper = document.createElement("div");

    createFocusLeaveHandler(onBlur)(focusEvent(wrapper, document.createElement("button")));

    expect(onBlur).toHaveBeenCalledOnce();
  });

  it("calls onBlur when focus goes nowhere", () => {
    const onBlur = vi.fn();

    createFocusLeaveHandler(onBlur)(focusEvent(document.createElement("div"), null));

    expect(onBlur).toHaveBeenCalledOnce();
  });

  it("does not call onBlur when focus stays inside the wrapper", () => {
    const onBlur = vi.fn();
    const wrapper = document.createElement("div");
    const inside = wrapper.appendChild(document.createElement("button"));

    createFocusLeaveHandler(onBlur)(focusEvent(wrapper, inside));

    expect(onBlur).not.toHaveBeenCalled();
  });

  it("does nothing without onBlur", () => {
    expect(() =>
      createFocusLeaveHandler(undefined)(focusEvent(document.createElement("div"), null)),
    ).not.toThrow();
  });
});
