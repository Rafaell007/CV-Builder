# ErrorScreen

The content of a full-screen error: the sad monitor, "Oops", a message and an optional action, in the Figma 560×591 box.

- **Props:** `title`, `message` (a node, so the caller can add Figma's line break), `announce` (puts the heading and message in a `role="alert"` region), `children` (the action under the message).
- The caller draws the full screen around it (page background, centring, when it shows).
- Server Components import it by folder: `@/shared/components/ErrorScreen`.
- **Exports:** `ErrorScreen`, type `ErrorScreenProps`.

Used by: [DeviceErrorGate](../../../features/device-error/README.md), [NoInternetState](../NoInternetState/README.md). Docs: [docs/pages/09-device-error-page.md](../../../../../docs/pages/09-device-error-page.md); values in `docs/design-tokens.md` › Device error and › No internet.
