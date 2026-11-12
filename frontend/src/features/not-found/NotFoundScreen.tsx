"use client";

import { ErrorScreen } from "@/shared/components/ErrorScreen";
import { useGoBack } from "./useGoBack";

type NotFoundScreenProps = {
  title: string;
  messageLine1: string;
  messageLine2: string;
  goBackLabel: string;
};

// The 404 screen. Texts come as props, because global-not-found has no language to translate with.
export function NotFoundScreen({
  title,
  messageLine1,
  messageLine2,
  goBackLabel,
}: NotFoundScreenProps) {
  const goBack = useGoBack();

  return (
    <ErrorScreen
      title={title}
      message={
        <>
          {messageLine1}
          <br />
          {messageLine2}
        </>
      }
      action={{ label: goBackLabel, onClick: goBack }}
    />
  );
}
