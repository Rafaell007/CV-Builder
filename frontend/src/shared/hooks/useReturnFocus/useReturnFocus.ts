import { useRef } from "react";

interface AutoFocusEvent {
  preventDefault: () => void;
}

// A menu item disappears when its menu closes, so the focus cannot return to it. Radix names every menu by its
// trigger (`aria-labelledby` holds the trigger id), and that button stays on the page: it is the opener then.
function findOpener(active: Element | null): HTMLElement | null {
  // The body means nothing was focused (Safari and Firefox on macOS do not focus a clicked button):
  // there is no opener to return to, and focusing the body would lose the user's place.
  if (!(active instanceof HTMLElement) || active === document.body) return null;

  const menu = active.closest('[role="menu"]');
  if (!menu) return active;

  const trigger = document.getElementById(menu.getAttribute("aria-labelledby") ?? "");
  return trigger instanceof HTMLElement ? trigger : null;
}

/**
 * Radix dialogs return focus only to their own Trigger. Ours are opened by page buttons and menu items,
 * so this remembers the element focused when the dialog opens and focuses it again when it closes.
 * For a dialog opened from a menu item, that is the button that opened the menu.
 * Spread the result on `Dialog.Content` / `AlertDialog.Content`.
 */
export function useReturnFocus() {
  const openerRef = useRef<HTMLElement | null>(null);

  return {
    onOpenAutoFocus: () => {
      // Runs before Radix moves focus inside, so this is still the element that opened the dialog.
      openerRef.current = findOpener(document.activeElement);
    },
    onCloseAutoFocus: (event: AutoFocusEvent) => {
      const opener = openerRef.current;
      openerRef.current = null;
      // A removed opener (e.g. a closed menu's item) keeps Radix's default.
      if (opener?.isConnected) {
        event.preventDefault();
        opener.focus();
      }
    },
  };
}
