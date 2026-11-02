import type { Preview } from "@storybook/nextjs-vite";
import { THEMES } from "@/shared/preferences";
import { roboto } from "@/shared/styles";
import { withAppProviders } from "./withAppProviders";
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
  },
  // Toolbar theme switcher (core Storybook, no addon). withAppProviders applies it through the preferences store.
  // https://storybook.js.org/docs/essentials/toolbars-and-globals
  globalTypes: {
    theme: {
      description: "Color theme",
      toolbar: { title: "Theme", icon: "mirror", items: [...THEMES], dynamicTitle: true },
    },
  },
  initialGlobals: { theme: "light" },
  decorators: [withAppProviders],
};

export default preview;
