"use client";

import { useRouter } from "next/navigation";

export function useGoBack(): () => void {
  const router = useRouter();

  return function goBack() {
    // 1 = only this page is in the tab's history (link opened in a new tab), so there is nothing to go back to.
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  };
}
