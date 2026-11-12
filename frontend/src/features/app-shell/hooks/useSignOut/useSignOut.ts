"use client";

import { useMutation } from "@apollo/client/react";
import { useTranslations } from "next-intl";
import { useToast } from "@/shared/components/Toast";
import { SignOutDocument } from "@/shared/graphql";
import { redirectToSignIn } from "@/shared/session";

export type UseSignOutResult = {
  signOut: () => Promise<void>;
  loading: boolean;
};

/** Ends the session on the backend, then loads the sign-in page; a full load drops the cached user data. */
export function useSignOut(): UseSignOutResult {
  const t = useTranslations("appShell");
  const toast = useToast();
  const [signOutMutation, { loading }] = useMutation(SignOutDocument);

  async function signOut() {
    try {
      await signOutMutation();
      redirectToSignIn();
    } catch {
      toast.error({ title: t("logoutFailed") });
    }
  }

  return { signOut, loading };
}
