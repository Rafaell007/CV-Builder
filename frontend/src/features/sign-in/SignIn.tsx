import { useTranslations } from "next-intl";
import { AuthTabs } from "@/shared/components";
import { SignInForm } from "./components/SignInForm";
import styles from "./SignIn.module.css";

// Not async and without hooks of its own, so it works in the Server Component page; the form is a Client Component.
export function SignIn() {
  const t = useTranslations("signIn");

  return (
    <main className={styles.page}>
      <AuthTabs
        active="sign-in"
        label={t("tabs.label")}
        signInLabel={t("tabs.signIn")}
        signUpLabel={t("tabs.signUp")}
      />
      <div className={styles.content}>
        <h1 className={styles.title}>{t("title")}</h1>
        <p className={styles.subtitle}>{t("subtitle")}</p>
        <SignInForm />
      </div>
    </main>
  );
}
