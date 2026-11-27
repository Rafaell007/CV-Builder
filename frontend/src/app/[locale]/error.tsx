"use client"; // Error boundaries must be Client Components.

import { NoInternetScreen, useClearQueryFailed } from "@/features/no-internet";

type ErrorPageProps = {
  error: unknown;
  retry: () => void;
};

// A page failed to render, e.g. its server query could not reach the backend. Full screen: it replaces
// the app shell too. RETRY fetches and renders the page again (Next.js `retry`, stable since 16.3).
export default function ErrorPage({ retry }: ErrorPageProps) {
  useClearQueryFailed();

  return (
    <main>
      <NoInternetScreen onRetry={retry} />
    </main>
  );
}
