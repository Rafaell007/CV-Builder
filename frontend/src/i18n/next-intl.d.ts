import type { routing } from "@/shared/i18n";
import type { Messages } from "./loadMessages";

// Types `useTranslations` keys and the `Locale` type from our config.
// https://next-intl.dev/docs/workflows/typescript
declare module "next-intl" {
  interface AppConfig {
    Locale: (typeof routing.locales)[number];
    Messages: Messages;
  }
}
