import { useRef } from "react";

interface AutoFocusEvent {
  preventDefault: () => void;
}

/**
 * Radix dialogs return focus only to their own Trigger. Ours are opened by page buttons and menu items,
 * so this remembers the element focused when the dialog opens and focuses it again when it closes.
 * Spread the result on `Dialog.Content` / `AlertDialog.Content`.
 */
export function useReturnFocus() {
  const openerRef = useRef<HTMLElement | null>(null);

  return {
    onOpenAutoFocus: () => {
      // Runs before Radix moves focus inside, so this is still the element that opened the dialog.
      // The body means nothing was focused (Safari and Firefox on macOS do not focus a clicked button):
      // there is no opener to return to, and focusing the body would lose the user's place.
      const active = document.activeElement;
      openerRef.current = active instanceof HTMLElement && active !== document.body ? active : null;
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
