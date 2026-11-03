"use client";

import { useMutation } from "@apollo/client/react";
import { useCallback, useEffect, useState } from "react";
import { ResendVerificationCodeDocument } from "@/shared/graphql";
import { RESEND_COOLDOWN_SECONDS } from "../verification.constants";
import { getErrorReason, getVerificationErrorMessage } from "../utils";

export type ResendStatus = { kind: "success" | "error"; message: string };

export type UseResendCodeResult = {
  resend: () => Promise<void>;
  loading: boolean;
  // Seconds until the next request is allowed; 0 when it is allowed now.
  secondsLeft: number;
  status: ResendStatus | null;
};

/**
 * Requests a new verification code and runs the cooldown timer. The timer is a convenience: the
 * backend rate-limits the mutation (AC-18) and its answer starts the timer too.
 */
export function useResendCode(): UseResendCodeResult {
  const [resendCode, { loading }] = useMutation(ResendVerificationCodeDocument);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [status, setStatus] = useState<ResendStatus | null>(null);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setTimeout(() => setSecondsLeft((seconds) => seconds - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  const resend = useCallback(async () => {
    if (loading || secondsLeft > 0) return;
    setStatus(null);
    try {
      await resendCode();
      setStatus({ kind: "success", message: "Verification code sent" });
      setSecondsLeft(RESEND_COOLDOWN_SECONDS);
    } catch (error) {
      setStatus({ kind: "error", message: getVerificationErrorMessage(error) });
      if (getErrorReason(error) === "RESEND_COOLDOWN") setSecondsLeft(RESEND_COOLDOWN_SECONDS);
    }
  }, [loading, secondsLeft, resendCode]);

  return { resend, loading, secondsLeft, status };
}
