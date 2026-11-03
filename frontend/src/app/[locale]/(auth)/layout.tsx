// Public routes: sign in, sign up, verification, password recovery.
export default function AuthLayout({ children }: LayoutProps<"/[locale]">) {
  return children;
}
