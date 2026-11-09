// A monitor with a sad face (device error and no internet screens), drawn from docs/design-tokens.md › Device error.
// The stand legs are estimated from docs/images/09-device-error-page.jpg.
export function SadMonitorIllustration() {
  return (
    <svg
      width="160"
      height="120"
      viewBox="0 0 160 120"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      overflow="visible"
      aria-hidden="true"
      focusable="false"
    >
      <rect x="0" y="0" width="160" height="100" rx="8" />
      <circle cx="55" cy="35" r="3" fill="currentColor" stroke="none" />
      <circle cx="105" cy="35" r="3" fill="currentColor" stroke="none" />
      <path d="M50 65 Q80 45 110 65" />
      <path d="M60 100 L50 120 M100 100 L110 120" />
      <path d="M40 120 H120" />
    </svg>
  );
}
