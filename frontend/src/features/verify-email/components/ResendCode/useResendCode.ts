"use client";

import { useMutation } from "@apollo/client/react";
import { useState } from "react";
import { readFailure } from "@/shared/failures";
import { ResendVerificationCodeDocument } from "@/shared/graphql";
import { ALREADY_VERIFIED_REASON } from "@/shared/session";
import type { ResendFailure, ResendMessage } from "./resend-code.types";
import { useCooldown } from "./useCooldown";

// The backend allows one code per 60 s (backend auth README). It decides; this only avoids a request that would fail.
export const RESEND_COOLDOWN_SECONDS = 60;

// Turns the failure of the resendVerificationCode mutation into what the page does (backend auth README).
// RESEND_COOLDOWN from the service, or the throttler's answer without a reason: both mean "wait".
function toResendFailure(error: unknown): ResendFailure {
  const { kind, reason } = readFailure(error);
  if (kind === "conflict" && reason === ALREADY_VERIFIED_REASON) return "alreadyVerified";
  return kind === "tooManyRequests" ? "cooldown" : "failed";
}

export type UseResendCodeOptions = {
  // A new code was sent: the page forgets the old one.
  onSent: () => void;
  // The backend says the account is verified: the page leaves.
  onAlreadyVerified: () => void;
};

/** State of the RESEND button: the request, the answer message and the wait before the next request. */
export function useResendCode({ onSent, onAlreadyVerified }: UseResendCodeOptions) {
  const [resend, { loading }] = useMutation(ResendVerificationCodeDocument);
  const { secondsLeft, start } = useCooldown();
  const [message, setMessage] = useState<ResendMessage | null>(null);

  async function send() {
    if (loading || secondsLeft > 0) return;
    setMessage(null);

    try {
      await resend();
    } catch (error) {
      const failure = toResendFailure(error);
      if (failure === "alreadyVerified") return onAlreadyVerified();
      if (failure === "cooldown") start(RESEND_COOLDOWN_SECONDS);
      setMessage(failure);
      return;
    }
    start(RESEND_COOLDOWN_SECONDS);
    setMessage("sent");
    onSent();
  }

  return { send, loading, secondsLeft, message };
}
