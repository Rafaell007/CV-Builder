import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { SignUpPage } from "@/features/sign-up";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("signUp");
  return { title: t("pageTitle") };
}

export default SignUpPage;
