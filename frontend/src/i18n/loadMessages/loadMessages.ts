import type { Locale } from "next-intl";
import type appShell from "@/features/app-shell/messages/en.json";
import type cvs from "@/features/cvs/messages/en.json";
import type deviceError from "@/features/device-error/messages/en.json";
import type forgotPassword from "@/features/forgot-password/messages/en.json";
import type health from "@/features/health/messages/en.json";
import type noInternet from "@/features/no-internet/messages/en.json";
import type notFound from "@/features/not-found/messages/en.json";
import type projects from "@/features/projects/messages/en.json";
import type resetPassword from "@/features/reset-password/messages/en.json";
import type settings from "@/features/settings/messages/en.json";
import type signIn from "@/features/sign-in/messages/en.json";
import type signUp from "@/features/sign-up/messages/en.json";
import type userDetails from "@/features/user-details/messages/en.json";
import type verifyEmail from "@/features/verify-email/messages/en.json";
import type common from "@/shared/i18n/messages/en.json";

// One namespace per messages folder. A feature that gets a `messages/` folder is added here (PLAN §4).
// English is the reference: every other language must have the same keys (checked by typecheck and the test).
export type Messages = {
  appShell: typeof appShell;
  common: typeof common;
  cvs: typeof cvs;
  deviceError: typeof deviceError;
  forgotPassword: typeof forgotPassword;
  health: typeof health;
  noInternet: typeof noInternet;
  notFound: typeof notFound;
  projects: typeof projects;
  resetPassword: typeof resetPassword;
  settings: typeof settings;
  signIn: typeof signIn;
  signUp: typeof signUp;
  userDetails: typeof userDetails;
  verifyEmail: typeof verifyEmail;
};

// One dynamic import per language, so a request loads only the messages of its own language.
// JSON files are imported directly: an index.ts would load every language together.
const loaders: Record<Locale, () => Promise<Messages>> = {
  en: async () => ({
    appShell: (await import("@/features/app-shell/messages/en.json")).default,
    common: (await import("@/shared/i18n/messages/en.json")).default,
    cvs: (await import("@/features/cvs/messages/en.json")).default,
    deviceError: (await import("@/features/device-error/messages/en.json")).default,
    forgotPassword: (await import("@/features/forgot-password/messages/en.json")).default,
    health: (await import("@/features/health/messages/en.json")).default,
    noInternet: (await import("@/features/no-internet/messages/en.json")).default,
    notFound: (await import("@/features/not-found/messages/en.json")).default,
    projects: (await import("@/features/projects/messages/en.json")).default,
    resetPassword: (await import("@/features/reset-password/messages/en.json")).default,
    settings: (await import("@/features/settings/messages/en.json")).default,
    signIn: (await import("@/features/sign-in/messages/en.json")).default,
    signUp: (await import("@/features/sign-up/messages/en.json")).default,
    userDetails: (await import("@/features/user-details/messages/en.json")).default,
    verifyEmail: (await import("@/features/verify-email/messages/en.json")).default,
  }),
  pl: async () => ({
    appShell: (await import("@/features/app-shell/messages/pl.json")).default,
    common: (await import("@/shared/i18n/messages/pl.json")).default,
    cvs: (await import("@/features/cvs/messages/pl.json")).default,
    deviceError: (await import("@/features/device-error/messages/pl.json")).default,
    forgotPassword: (await import("@/features/forgot-password/messages/pl.json")).default,
    health: (await import("@/features/health/messages/pl.json")).default,
    noInternet: (await import("@/features/no-internet/messages/pl.json")).default,
    notFound: (await import("@/features/not-found/messages/pl.json")).default,
    projects: (await import("@/features/projects/messages/pl.json")).default,
    resetPassword: (await import("@/features/reset-password/messages/pl.json")).default,
    settings: (await import("@/features/settings/messages/pl.json")).default,
    signIn: (await import("@/features/sign-in/messages/pl.json")).default,
    signUp: (await import("@/features/sign-up/messages/pl.json")).default,
    userDetails: (await import("@/features/user-details/messages/pl.json")).default,
    verifyEmail: (await import("@/features/verify-email/messages/pl.json")).default,
  }),
};

export const loadMessages = (locale: Locale): Promise<Messages> => loaders[locale]();
