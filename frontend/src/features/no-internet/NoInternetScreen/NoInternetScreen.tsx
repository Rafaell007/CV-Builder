import { useTranslations } from "next-intl";
import { NoInternetState } from "@/shared/components/NoInternetState";

type NoInternetScreenProps = {
  onRetry: () => void;
};

// The No Internet screen with its texts. NoInternetGate (failed browser queries) and app/[locale]/error.tsx
// (failed server rendering) differ only in what RETRY does.
export function NoInternetScreen({ onRetry }: NoInternetScreenProps) {
  const t = useTranslations("noInternet");

  return (
    <NoInternetState
      title={t("title")}
      message={
        <>
          {t("messageLine1")}
          <br />
          {t("messageLine2")}
        </>
      }
      retryLabel={t("retry")}
      onRetry={onRetry}
    />
  );
}
