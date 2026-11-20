import { useTranslations } from "next-intl";
import { ForgotPasswordForm } from "../components/ForgotPasswordForm";
import styles from "./ForgotPasswordPage.module.css";

export function ForgotPasswordPage() {
  const t = useTranslations("forgotPassword");

  return (
    <main className={styles.page}>
      <div className={styles.content}>
        <h1 className={styles.title}>{t("title")}</h1>
        <p className={styles.subtitle}>{t("subtitle")}</p>
        <ForgotPasswordForm />
      </div>
    </main>
  );
}
