"use client";

import { Button, ButtonLink } from "./components/Button";
import { PasswordField } from "./components/PasswordField";
import { TextField } from "./components/TextField";
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
        />
        <PasswordField
          {...getFieldProps("confirmPassword")}
          label="Confirm Password"
          name="confirmPassword"
          autoComplete="new-password"
          required
        />
      </div>
      {formError !== undefined && (
        <p role="alert" className={styles.error}>
          {formError}
        </p>
      )}
      <div className={styles.actions}>
        <Button type="submit" loading={pending}>
          Create account
        </Button>
        <ButtonLink href="/sign-in">I have an account</ButtonLink>
      </div>
    </form>
  );
}
