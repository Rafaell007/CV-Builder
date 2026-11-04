# Toast

Short notifications in the bottom-right corner after an action ("Skill added", "Could not remove skills"). Built on Radix Toast; `ToastProvider` holds the list, `useToast()` shows a toast.

```tsx
const toast = useToast();
toast.success({ title: t("skillAdded"), description: t("skillAddedText") });
```

- `success`, `error`, `warning`, `info`; `title` is required, `description` optional. Texts are already translated.
- At most 3 at once: a new toast pushes out the oldest. Newest at the bottom, 8px apart, 24px from the corner.
- Each toast closes after 5 s (Radix default), paused on hover, focus and window blur; × (`closeLabel`), Escape and a swipe right close it earlier.
- Screen readers: error toasts are announced at once (Radix `type="foreground"`), the others when the reader is free (`background`), so a success never cuts off an error.
- F8 moves focus to the toasts; Tab then reaches each one and its × button.
- Closing plays an exit animation before the toast leaves the list; with `prefers-reduced-motion` only a short fade.
- While a modal is open, toasts show above it and stay clickable (`pointer-events: auto`), and screen readers still hear them (Radix announces through its own live region). Like the rest of the page, the toast itself is hidden from screen readers and outside the modal's focus trap until the modal closes.

`ToastProvider` is rendered once by `app/[locale]/layout.tsx` with the `common.toast` texts; `renderWithProviders` and Storybook's `withAppProviders` render it too, so tests and stories can show toasts. Server Components import it from `@/shared/components/Toast`, not the `@/shared/components` barrel.

Used by: create, update and delete flows on the CRUD pages. Reference: `Toast.stories.tsx` (Storybook "Shared/Toast"). Docs: [docs/design-tokens.md](../../../../../docs/design-tokens.md) (Toast), [Radix Toast](https://www.radix-ui.com/primitives/docs/components/toast).
