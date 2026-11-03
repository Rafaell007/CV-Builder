"use client";

import Link from "next/link";
// KAN-78: replace this import with `import { OtpField } from "@/shared/components"`.
import { OtpFieldStub as OtpField } from "../components";
import { useEmailVerification } from "../useEmailVerification";
import { APP_HOME_PATH, CODE_LENGTH } from "../verification.constants";
import styles from "./VerifyEmail.module.css";

export function VerifyEmail() {
  const { code, error, loading, done, changeCode, submit, resend } = useEmailVerification();
  const { resend: resendCode, loading: resending, secondsLeft, status } = resend;

  return (
    <main className={styles.page}>
      <form
        className={styles.form}
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <h1 className={styles.title}>Email verification</h1>
        <p className={styles.subtitle}>Enter the verification code we sent to your email.</p>

        <OtpField
          name="code"
          label="Verification code"
          length={CODE_LENGTH}
          value={code}
          onChange={changeCode}
          error={error}
          disabled={loading || done}
          autoFocus
        />

        <div className={styles.actions}>
          <button
            type="submit"
            className={styles.primary}
            disabled={loading || done}
            aria-busy={loading}
          >
            CONFIRM
          </button>
          <Link href={APP_HOME_PATH} className={styles.secondary}>
            LATER
          </Link>
        </div>

        <div className={styles.resend}>
          <button
            type="button"
            className={styles.link}
            disabled={resending || secondsLeft > 0 || done}
            aria-busy={resending}
            onClick={() => void resendCode()}
          >
            {secondsLeft > 0 ? `RESEND CODE (${secondsLeft}s)` : "RESEND CODE"}
          </button>
          {status ? (
            <p
              role={status.kind === "error" ? "alert" : "status"}
              className={status.kind === "error" ? styles.statusError : styles.statusSuccess}
            >
              {status.message}
            </p>
          ) : null}
        </div>
      </form>
    </main>
  );
}
