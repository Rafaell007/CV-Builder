import { useTranslations } from "next-intl";
import { Button } from "@/shared/components";
import { Link } from "@/shared/i18n";
import styles from "./ResetPasswordNotice.module.css";

export type ResetPasswordNoticeProps = {
  tone: "success" | "error";
  message: string;
  // For a link that cannot be used any more: a way to ask for a new one.
  offerNewLink?: boolean;
};

// The end of the page: the password was changed, or the link in the mail cannot be used.
export function ResetPasswordNotice({
  tone,
  message,
  offerNewLink = false,
}: ResetPasswordNoticeProps) {
  const t = useTranslations("resetPassword");

  return (
    <div className={styles.notice}>
      <p role={tone === "success" ? "status" : "alert"} className={styles.message}>
        {message}
      </p>
      <div className={styles.actions}>
        {offerNewLink && (
          <Button asChild>
            <Link href="/forgot-password">{t("requestNewLink")}</Link>
          </Button>
        )}
        <Button asChild variant={offerNewLink ? "ghost" : "primary"}>
          <Link href="/sign-in">{t("goToSignIn")}</Link>
        </Button>
      </div>
    </div>
  );
}
