import { useTranslations } from "next-intl";
import { ResetPasswordForm } from "./components/ResetPasswordForm";
import { ResetPasswordNotice } from "./components/ResetPasswordNotice";
import styles from "./ResetPasswordPage.module.css";

export type ResetPasswordPageProps = {
  // The `token` of the link in the mail; undefined when the link has none.
  token: string | undefined;
};

export function ResetPasswordPage({ token }: ResetPasswordPageProps) {
  const t = useTranslations("resetPassword");

  return (
    <main className={styles.page}>
      <div className={styles.content}>
        <h1 className={styles.title}>{t("title")}</h1>
        <p className={styles.subtitle}>{t("subtitle")}</p>
        {token === undefined || token === "" ? (
          <ResetPasswordNotice tone="error" message={t("errors.tokenInvalid")} offerNewLink />
        ) : (
          <ResetPasswordForm token={token} />
        )}
      </div>
    </main>
  );
}
