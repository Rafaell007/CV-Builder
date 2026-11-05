// Figma's chip remove: a 12×12 grey circle with a 6×6 X. Colours from the parent's CSS variables.
// The 1.5px stroke is a prediction (the X's stroke is not readable in Figma).
export function ChipRemoveIcon({ className }: { className?: string | undefined }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <circle cx="6" cy="6" r="6" fill="var(--color-chip-remove-bg)" />
      <path d="M3 3l6 6M9 3l-6 6" stroke="var(--color-chip-remove-icon)" strokeWidth="1.5" />
    </svg>
  );
}
