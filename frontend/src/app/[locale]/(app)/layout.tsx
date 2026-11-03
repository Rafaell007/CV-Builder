// Protected routes. Session check and role guards are added in S0.10.
export default function AppLayout({ children }: LayoutProps<"/[locale]">) {
  return children;
}
