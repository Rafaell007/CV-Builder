import { useTranslations } from "next-intl";
import { ErrorScreen } from "@/shared/components/ErrorScreen";

type NoInternetScreenProps = {
  onRetry: () => void;
};

// The No Internet screen. NoInternetGate (failed browser queries) and app/[locale]/error.tsx
// (failed server rendering) differ only in what RETRY does.
export function NoInternetScreen({ onRetry }: NoInternetScreenProps) {
  const t = useTranslations("noInternet");

  return (
    <ErrorScreen
      title={t("title")}
      message={
        <>
          {t("messageLine1")}
          <br />
          {t("messageLine2")}
        </>
      }
      action={{ label: t("retry"), onClick: onRetry }}
      announce
    />
  );
}
