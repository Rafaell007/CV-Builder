import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ResetPasswordPage } from "@/features/reset-password";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("resetPassword");
  return { title: t("pageTitle") };
}

type PageProps = {
  searchParams: Promise<{ token?: string | string[] }>;
};

// The link in the mail is /reset-password?token=...; a repeated `token` is treated as no token.
export default async function Page({ searchParams }: PageProps) {
  const { token } = await searchParams;
  return <ResetPasswordPage token={typeof token === "string" ? token : undefined} />;
}
