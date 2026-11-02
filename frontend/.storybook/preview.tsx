import { withThemeByDataAttribute } from "@storybook/addon-themes";
import type { Preview, ReactRenderer } from "@storybook/nextjs-vite";
import { roboto } from "@/shared/styles";
// Same global styles as app/layout.tsx: tokens, light/dark themes, base styles.
import "@/shared/styles/global.css";

// Same font as app/layout.tsx, which sets this class on <html>.
document.documentElement.classList.add(roboto.variable);

const preview: Preview = {
  parameters: {
    // Components use the App Router (next/navigation), not the Pages Router.
    nextjs: { appDirectory: true },
  },
  decorators: [
    // Toolbar theme switcher. Sets <html data-theme="light|dark">, the attribute themes.css reacts to.
    withThemeByDataAttribute<ReactRenderer>({
      themes: { light: "light", dark: "dark" },
      defaultTheme: "light",
      attributeName: "data-theme",
    }),
  ],
};

export default preview;
