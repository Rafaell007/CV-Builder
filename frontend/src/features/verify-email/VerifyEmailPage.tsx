import { useTranslations } from "next-intl";
import { VerifyEmailForm } from "./components/VerifyEmailForm";
import styles from "./VerifyEmailPage.module.css";

export function VerifyEmailPage() {
  const t = useTranslations("verifyEmail");

  return (
    <main className={styles.page}>
      <div className={styles.content}>
        <h1 className={styles.title}>{t("title")}</h1>
        <p className={styles.subtitle}>{t("subtitle")}</p>
        <VerifyEmailForm />
      </div>
    </main>
  );
}
