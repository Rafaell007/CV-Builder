"use client";

import { useMutation } from "@apollo/client/react";
import { useState } from "react";
import { ResendVerificationCodeDocument } from "@/shared/graphql";
import type { ResendMessage } from "./resend-code.types";
import { useCooldown } from "./useCooldown";
import { toResendFailure } from "./utils";

// The backend allows one code per 60 s (backend auth README). It decides; this only avoids a request that would fail.
export const RESEND_COOLDOWN_SECONDS = 60;

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
