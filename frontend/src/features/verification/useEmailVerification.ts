"use client";

import { useMutation } from "@apollo/client/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useCurrentUser } from "@/shared/currentUser";
import { VerifyEmailDocument } from "@/shared/graphql";
import { getVerificationErrorMessage, validateCode } from "./utils";
import { useResendCode } from "./useResendCode";
import { APP_HOME_PATH } from "./verification.constants";

/**
 * State and actions of the verification page: the typed code, CONFIRM and RESEND. The backend decides
 * whether a code is valid; this hook only checks the format first (PLAN S3.6).
 */
export function useEmailVerification() {
  const router = useRouter();
  const { user } = useCurrentUser();
  const [verifyEmail, { loading }] = useMutation(VerifyEmailDocument);
  const resend = useResendCode();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  // A verified user has nothing to do here. The proxy (S3.2) redirects too; this covers client navigation.
  const isVerified = user?.isVerified ?? false;
  useEffect(() => {
    if (isVerified) router.replace(APP_HOME_PATH);
  }, [isVerified, router]);

  function changeCode(value: string) {
    setCode(value);
    setError(null);
  }

  async function submit() {
    if (loading || done) return;
    const formatError = validateCode(code);
    if (formatError) {
      setError(formatError);
      return;
    }
    try {
      await verifyEmail({ variables: { input: { code } } });
      // No more attempts while the redirect runs. A failed attempt keeps the typed code (AC-21).
      setDone(true);
      router.replace(APP_HOME_PATH);
    } catch (verifyError) {
      setError(getVerificationErrorMessage(verifyError));
    }
  }

  return { code, error, loading, done, changeCode, submit, resend };
}
