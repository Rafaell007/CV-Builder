import { useTranslations } from "next-intl";
import { Suspense } from "react";
import { HealthCheck } from "@/features/health";

// Placeholder (PLAN §6); the real page comes with its own step. HealthCheck is the Apollo demo (KAN-68).
export default function UsersPage() {
  const t = useTranslations();

  return (
    <>
      <h1>{t("common.employees")}</h1>
      <Suspense fallback={<p>{t("health.checking")}</p>}>
        <HealthCheck />
      </Suspense>
    </>
  );
}
