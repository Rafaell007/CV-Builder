"use client";

import Link from "next/link";
import { Button, PasswordField, TextField } from "@/shared/components";
import styles from "./SignUpForm.module.css";
import { useSignUp } from "./useSignUp";

export function SignUpForm() {
  const { getFieldProps, pending, formError, onSubmit } = useSignUp();

  return (
    <form className={styles.form} onSubmit={onSubmit} noValidate>
      <div className={styles.fields}>
        <TextField
          {...getFieldProps("email")}
          label="Email"
          type="email"
          name="email"
          autoComplete="email"
          required
        />
        <PasswordField
          {...getFieldProps("password")}
          label="Password"
          name="password"
          autoComplete="new-password"
          required
          showPasswordLabel="Show password"
          hidePasswordLabel="Hide password"
        />
        <PasswordField
          {...getFieldProps("confirmPassword")}
          label="Confirm Password"
          name="confirmPassword"
          autoComplete="new-password"
          required
          showPasswordLabel="Show confirm password"
          hidePasswordLabel="Hide confirm password"
        />
      </div>
      {formError !== undefined && (
        <p role="alert" className={styles.error}>
          {formError}
        </p>
      )}
      <div className={styles.actions}>
        <Button type="submit" loading={pending} className={styles.submit}>
          Create account
        </Button>
        <Button asChild variant="ghost">
          <Link href="/sign-in">I have an account</Link>
        </Button>
      </div>
    </form>
  );
}
