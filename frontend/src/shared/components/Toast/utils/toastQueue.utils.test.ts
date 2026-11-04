import { describe, expect, it } from "vitest";
import type { ToastEntry } from "../Toast.types";
import { addToast, closeToast, removeToast } from "./toastQueue.utils";

function entry(id: string, open = true): ToastEntry {
  return { id, variant: "info", title: `Toast ${id}`, open };
}

describe("addToast", () => {
  it("appends the new toast last", () => {
    expect(addToast([entry("a")], entry("b"))).toEqual([entry("a"), entry("b")]);
  });

  it("closes the oldest open toast when the limit is passed", () => {
    const toasts = [entry("a"), entry("b"), entry("c")];

    expect(addToast(toasts, entry("d"), 3)).toEqual([
      entry("a", false),
      entry("b"),
      entry("c"),
      entry("d"),
    ]);
  });

  it("drops toasts that are already closed", () => {
    expect(addToast([entry("a", false), entry("b")], entry("c"))).toEqual([entry("b"), entry("c")]);
  });

  it("does not change the list it was given", () => {
    const toasts = [entry("a")];
    addToast(toasts, entry("b"), 1);

    expect(toasts).toEqual([entry("a")]);
  });
});

describe("closeToast", () => {
  it("marks only the matching toast closed", () => {
    expect(closeToast([entry("a"), entry("b")], "a")).toEqual([entry("a", false), entry("b")]);
  });

  it("returns the same toasts for an unknown id", () => {
    expect(closeToast([entry("a")], "x")).toEqual([entry("a")]);
  });
});

describe("removeToast", () => {
  it("drops the matching toast", () => {
    expect(removeToast([entry("a"), entry("b")], "a")).toEqual([entry("b")]);
  });
});
