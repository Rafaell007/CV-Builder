import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, renderWithProviders, screen } from "@/shared/testing";
import { SearchField } from "./SearchField";

describe("SearchField", () => {
  beforeEach(() => {
    // shouldAdvanceTime: Testing Library's async wrapper waits on a 0ms timer, which a frozen clock never fires.
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function setup(defaultValue?: string) {
    const onSearch = vi.fn();
    const { user } = renderWithProviders(
      <SearchField
        label="Search employees"
        placeholder="Search"
        onSearch={onSearch}
        defaultValue={defaultValue}
      />,
    );
    return { onSearch, user, input: screen.getByRole("searchbox", { name: "Search employees" }) };
  }

  it("is a search box named by its label, showing the current search", () => {
    const { input } = setup("Ann");

    expect(input).toHaveValue("Ann");
    expect(input).toHaveAttribute("placeholder", "Search");
  });

  it("searches once, 300ms after typing stops", async () => {
    const { onSearch, user, input } = setup();

    await user.type(input, "react");
    expect(onSearch).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(300));
    expect(onSearch).toHaveBeenCalledExactlyOnceWith("react");
  });

  it("searches at once on Enter, without a second call later", async () => {
    const { onSearch, user, input } = setup();

    await user.type(input, "react{Enter}");
    act(() => vi.advanceTimersByTime(300));

    expect(onSearch).toHaveBeenCalledExactlyOnceWith("react");
  });

  it("reports an empty search when the text is cleared", async () => {
    const { onSearch, user, input } = setup("Ann");

    await user.clear(input);
    act(() => vi.advanceTimersByTime(300));

    expect(onSearch).toHaveBeenCalledExactlyOnceWith("");
  });

  it("does not submit a form around it on Enter", async () => {
    const onSubmit = vi.fn((event: SubmitEvent) => event.preventDefault());
    const { user } = renderWithProviders(
      <form onSubmit={(event) => onSubmit(event.nativeEvent as SubmitEvent)}>
        <SearchField label="Search employees" onSearch={vi.fn()} />
        <button type="submit">Go</button>
      </form>,
    );

    await user.type(screen.getByRole("searchbox", { name: "Search employees" }), "react{Enter}");

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("ignores Enter while an input method is composing text", () => {
    const { onSearch, input } = setup();

    fireEvent.keyDown(input, { key: "Enter", isComposing: true });

    expect(onSearch).not.toHaveBeenCalled();
  });
});
