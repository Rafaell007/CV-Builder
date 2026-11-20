import { useTranslations } from "next-intl";
import { AuthTabs } from "@/shared/components/AuthTabs";
import { SignUpForm } from "../components/SignUpForm";
import styles from "./SignUpPage.module.css";

export function SignUpPage() {
  const t = useTranslations("signUp");

  return (
    <main className={styles.page}>
      <AuthTabs
        active="sign-up"
        label={t("tabs.label")}
        signInLabel={t("tabs.signIn")}
        signUpLabel={t("tabs.signUp")}
      />
      <div className={styles.content}>
        <h1 className={styles.title}>{t("title")}</h1>
        <p className={styles.subtitle}>{t("subtitle")}</p>
        <SignUpForm />
      </div>
    </main>
  );
}
