import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { ResetPasswordPage } from "@/features/reset-password";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("resetPassword");
  return { title: t("pageTitle") };
}

type SearchParams = Promise<{ token?: string | string[] }>;

// Reading the query string makes the page dynamic, so it waits inside <Suspense> (Next.js 16 prerendering).
// A repeated `token` is treated as no token.
async function ResetPasswordWithToken({ searchParams }: { searchParams: SearchParams }) {
  const { token } = await searchParams;
  return <ResetPasswordPage token={typeof token === "string" ? token : undefined} />;
}

// The link in the mail is /reset-password?token=...
export default function Page({ searchParams }: { searchParams: SearchParams }) {
  return (
    <Suspense fallback={null}>
      <ResetPasswordWithToken searchParams={searchParams} />
    </Suspense>
  );
}
