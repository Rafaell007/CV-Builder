# ErrorScreen

Full-screen error: the sad monitor, a title, a message and an optional button. One layout for No Internet, Not Found and Device Error (Figma draws them the same).

- **Props:** `title`, `message` (a node, so the caller can add Figma's line break), `action` (optional `{ label, onClick }`; no action = no button), `announce` (true = heading and message in a `role="alert"` region, read out as soon as the screen appears; use it for sudden errors like No Internet). All texts come from the caller.
- Works in Server Components when no `action` is passed (import it by its folder, not the barrel).
- For a failed list request inside a page, use [PageState](../PageState/README.md) instead.
- **Exports:** `ErrorScreen`, types `ErrorScreenProps`, `ErrorScreenAction`.

Used by: `DeviceErrorGate` (`features/device-error`), the Not Found and No Internet screens (S4.1, S4.2). Docs: [07-no-internet-page.md](../../../../../docs/pages/07-no-internet-page.md), [08-not-found-page.md](../../../../../docs/pages/08-not-found-page.md), [09-device-error-page.md](../../../../../docs/pages/09-device-error-page.md); values in `docs/design-tokens.md` › No internet, Not found, Device error.
