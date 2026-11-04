import { screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/shared/testing";
import type { ToastContent, ToastVariant } from "../Toast.types";
import { useToast } from "../useToast";

function ShowButton({ variant, ...content }: ToastContent & { variant: ToastVariant }) {
  const toast = useToast();
  return (
    <button type="button" onClick={() => toast[variant](content)}>
      Show {content.title}
    </button>
  );
}

// renderWithProviders wraps the UI in the app's ToastProvider with the real (English) labels.
function renderToasts(buttons: ReadonlyArray<ToastContent & { variant: ToastVariant }>) {
  return renderWithProviders(
    <>
      {buttons.map((button) => (
        <ShowButton key={button.title} {...button} />
      ))}
    </>,
  );
}

function toastArea() {
  return screen.getByRole("region", { name: "Notifications (F8)" });
}

function shownToasts() {
  return within(toastArea()).queryAllByRole("listitem");
}

afterEach(() => {
  vi.useRealTimers();
});

describe("ToastProvider", () => {
  it("shows a toast with its title and text", async () => {
    const { user } = renderToasts([
      { variant: "success", title: "Saved", description: "Skill added" },
    ]);

    await user.click(screen.getByRole("button", { name: "Show Saved" }));

    const toast = within(toastArea()).getByRole("listitem");
    expect(within(toast).getByText("Saved")).toBeInTheDocument();
    expect(within(toast).getByText("Skill added")).toBeInTheDocument();
  });

  it("closes a toast with its close button", async () => {
    const { user } = renderToasts([{ variant: "info", title: "Heads up" }]);
    await user.click(screen.getByRole("button", { name: "Show Heads up" }));

    await user.click(
      within(within(toastArea()).getByRole("listitem")).getByRole("button", {
        name: "Close notification",
      }),
    );

    await waitFor(() => expect(shownToasts()).toHaveLength(0));
  });

  it("keeps at most three toasts; a new one pushes out the oldest", async () => {
    const titles = ["One", "Two", "Three", "Four"];
    const { user } = renderToasts(titles.map((title) => ({ variant: "info", title })));

    for (const title of titles) {
      await user.click(screen.getByRole("button", { name: `Show ${title}` }));
    }

    await waitFor(() => expect(shownToasts()).toHaveLength(3));
    expect(shownToasts().map((toast) => toast.textContent)).toEqual([
      expect.stringContaining("Two"),
      expect.stringContaining("Three"),
      expect.stringContaining("Four"),
    ]);
  });

  it.each([
    ["error", "assertive"],
    ["success", "polite"],
  ] as const)("announces a %s toast as %s", async (variant, live) => {
    const { user } = renderToasts([{ variant, title: "Something happened" }]);

    await user.click(screen.getByRole("button", { name: "Show Something happened" }));

    // Radix copies the text into a hidden live region; screen readers read that one.
    const announcement = await screen.findByText(/Notification\s+Something happened/);
    expect(announcement.closest("[aria-live]")).toHaveAttribute("aria-live", live);
  });

  it("closes a toast after the default 5 seconds", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const { user } = renderToasts([{ variant: "warning", title: "Careful" }]);
    await user.click(screen.getByRole("button", { name: "Show Careful" }));
    expect(shownToasts()).toHaveLength(1);

    await vi.advanceTimersByTimeAsync(5000);

    await waitFor(() => expect(shownToasts()).toHaveLength(0));
  });

  it("moves focus to the toast list on F8", async () => {
    const { user } = renderToasts([{ variant: "info", title: "Heads up" }]);
    await user.click(screen.getByRole("button", { name: "Show Heads up" }));

    // Radix matches the hotkey by `event.code`; [F8] presses the key by its code.
    await user.keyboard("[F8]");

    expect(within(toastArea()).getByRole("list")).toHaveFocus();
  });
});
