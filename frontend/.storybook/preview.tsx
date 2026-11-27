import type { Preview } from "@storybook/nextjs-vite";
import { routing } from "@/shared/i18n";
import { THEMES } from "@/shared/preferences";
import { roboto } from "@/shared/styles";
import { loadAppMessages, withAppProviders } from "./withAppProviders";
// Same global styles as app/layout.tsx: tokens, light/dark themes, base styles.
import "@/shared/styles/global.css";

// Same font as app/layout.tsx, which sets this class on <html>.
document.documentElement.classList.add(roboto.variable);

const preview: Preview = {
  // A docs page for every component; opt out with `tags: ["!autodocs"]`. https://storybook.js.org/docs/writing-docs/autodocs
  tags: ["autodocs"],
  parameters: {
    // Components use the App Router (next/navigation), not the Pages Router.
    nextjs: { appDirectory: true },
    // Accessibility violations fail the story test (pnpm test, CI). A story can opt out with
    // `parameters: { a11y: { test: "todo" } }` (warning only). https://storybook.js.org/docs/writing-tests/accessibility-testing
    a11y: { test: "error" },
    // The two screen sizes the project supports (the page documents: desktop and tablet). A story picks one with
    // `globals: { viewport: { value: "tablet" | "desktop", isRotated: false } }`; the toolbar lists the same two.
    // https://storybook.js.org/docs/essentials/viewport
    viewport: {
      options: {
        tablet: {
          name: "Tablet 768px",
          styles: { width: "768px", height: "1024px" },
          type: "tablet",
        },
        desktop: {
          name: "Desktop 1440px",
          styles: { width: "1440px", height: "900px" },
          type: "desktop",
        },
      },
    },
  },
  // Toolbar theme and language switchers (core Storybook, no addon). withAppProviders applies the theme through
  // the preferences store and the language through next-intl. https://storybook.js.org/docs/essentials/toolbars-and-globals
  globalTypes: {
    theme: {
      description: "Color theme",
      toolbar: { title: "Theme", icon: "mirror", items: [...THEMES], dynamicTitle: true },
    },
    locale: {
      description: "Language",
      toolbar: {
        title: "Language",
        icon: "globe",
        items: [...routing.locales],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: { theme: "light", locale: routing.defaultLocale },
  loaders: [loadAppMessages],
  decorators: [withAppProviders],
};

export default preview;
