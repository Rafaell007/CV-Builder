import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { VerifyEmailPage } from "@/features/verify-email";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("verifyEmail");
  return { title: t("pageTitle") };
}

export default function Page() {
  return <VerifyEmailPage />;
}
