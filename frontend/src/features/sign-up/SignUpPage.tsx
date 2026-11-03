import { AuthTabs } from "./components/AuthTabs";
import { SignUpForm } from "./components/SignUpForm";
import styles from "./SignUpPage.module.css";

export function SignUpPage() {
  return (
    <main className={styles.page}>
      <AuthTabs active="sign-up" />
      <div className={styles.content}>
        <h1 className={styles.title}>Sign up now</h1>
        <p className={styles.subtitle}>Welcome! Sign up to continue</p>
        <SignUpForm />
      </div>
    </main>
  );
}
