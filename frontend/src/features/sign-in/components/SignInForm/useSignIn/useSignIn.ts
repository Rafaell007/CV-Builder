"use client";

import { useMutation } from "@apollo/client/react";
import { useState } from "react";
import { MeDocument, SignInDocument } from "@/shared/graphql";
import { useRouter } from "@/shared/i18n";
import { HOME_PATH } from "@/shared/session";
import type { SignInErrorKind, SignInValues } from "../sign-in.types";
import { getSignInErrorKind } from "../utils";

export type UseSignInResult = {
  signIn: (values: SignInValues) => Promise<void>;
  // True from the click until the next page has opened, so the button does not come back to life during the redirect.
  pending: boolean;
  errorKind: SignInErrorKind | null;
};

/** Sends the `signIn` mutation, then opens the main page. The backend sets the session cookies. */
export function useSignIn(): UseSignInResult {
  const router = useRouter();
  const [mutate, { loading }] = useMutation(SignInDocument);
  const [errorKind, setErrorKind] = useState<SignInErrorKind | null>(null);
  const [redirecting, setRedirecting] = useState(false);

  async function signIn(values: SignInValues) {
    if (loading || redirecting) return;
    setErrorKind(null);
    try {
      await mutate({
        variables: { input: values },
        // The signed-in user is known now: fill the `me` query so the app does not ask the backend again.
        update: (cache, { data }) => {
          if (data) cache.writeQuery({ query: MeDocument, data: { me: data.signIn } });
        },
      });
    } catch (error) {
      setErrorKind(getSignInErrorKind(error));
      return;
    }
    setRedirecting(true);
    router.replace(HOME_PATH);
  }

  return { signIn, pending: loading || redirecting, errorKind };
}
