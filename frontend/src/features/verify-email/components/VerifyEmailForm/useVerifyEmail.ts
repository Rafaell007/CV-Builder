"use client";

import { useApolloClient, useMutation } from "@apollo/client/react";
import { useTranslations } from "next-intl";
import { useEffect, useState, type FormEvent } from "react";
import { useCurrentUser } from "@/shared/currentUser";
import { MeDocument, VerifyEmailDocument } from "@/shared/graphql";
import { useRouter } from "@/shared/i18n";
import { HOME_PATH } from "@/shared/session";
import type { VerifyEmailErrorKey } from "./verify-email.types";
import { toVerifyEmailFailure, validateCode } from "./utils";

/**
 * State of the verification form. A client-side error (empty or incomplete code) shows after a submit.
 * The code stays when a request fails, and a failure message goes away when the user types (AC-21).
 * The backend decides if the code is good (AC-6). The page only reads `me` to send a verified user away:
 * it never stores the verification status itself.
 */
export function useVerifyEmail() {
  const router = useRouter();
  const t = useTranslations("verifyEmail.errors");
  const { cache } = useApolloClient();
  const { user } = useCurrentUser();
  const [code, setCode] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [failure, setFailure] = useState<VerifyEmailErrorKey | null>(null);
  const [redirecting, setRedirecting] = useState(false);
  const [verifyEmail, { loading }] = useMutation(VerifyEmailDocument);

  // `redirecting` keeps the form locked between the answer and the page change (AC-11).
  const pending = loading || redirecting;
  const isVerified = user?.isVerified === true;

  // A user who is verified already has nothing to do here.
  useEffect(() => {
    if (isVerified && !redirecting) router.replace(HOME_PATH);
  }, [isVerified, redirecting, router]);

  function leave() {
    setRedirecting(true);
    router.replace(HOME_PATH);
  }

  // `me` is cached from before, so it must learn that the account is verified now.
  function onAlreadyVerified() {
    cache.updateQuery({ query: MeDocument }, (data) =>
      data?.me ? { me: { ...data.me, isVerified: true } } : data,
    );
    leave();
  }

  async function submit() {
    if (pending) return;
    setSubmitted(true);
    if (validateCode(code) !== undefined) return;

    setFailure(null);
    try {
      await verifyEmail({
        variables: { input: { code } },
        // The answer is the user with `isVerified: true`; `me` must show it before the next page reads it.
        update: (cache, { data }) => {
          if (data) cache.writeQuery({ query: MeDocument, data: { me: data.verifyEmail } });
        },
      });
    } catch (error) {
      const result = toVerifyEmailFailure(error);
      if (result === "alreadyVerified") onAlreadyVerified();
      else setFailure(result);
      return;
    }
    setRedirecting(true);
    router.push(HOME_PATH);
  }

  const key = failure ?? (submitted ? validateCode(code) : undefined);

  return {
    code,
    onCodeChange: (value: string) => {
      setCode(value);
      setFailure(null);
    },
    error: key === undefined ? undefined : t(key),
    pending,
    locked: redirecting,
    // A user who arrived verified sees nothing and is sent away. After a good code the form stays, locked, until the page changes.
    hidden: isVerified && !redirecting,
    // A new code was sent: the old one and its error are of no use any more.
    onCodeResent: () => {
      setCode("");
      setFailure(null);
      setSubmitted(false);
    },
    onAlreadyVerified,
    onSubmit: (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      void submit();
    },
  };
}
