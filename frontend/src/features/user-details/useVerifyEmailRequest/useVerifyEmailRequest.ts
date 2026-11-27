"use client";

import { useApolloClient, useMutation } from "@apollo/client/react";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { useToast } from "@/shared/components";
import { readFailure } from "@/shared/failures";
import { MeDocument, ResendVerificationCodeDocument } from "@/shared/graphql";
import { useRouter } from "@/shared/i18n";
import { ALREADY_VERIFIED_REASON, VERIFY_EMAIL_PATH } from "@/shared/session";

/** What a VERIFY EMAIL request ended with (backend auth README › Errors). */
type VerifyEmailRequestOutcome = "sent" | "sentRecently" | "alreadyVerified" | "failed";

// RESEND_COOLDOWN: a code was mailed less than a minute ago, so a good one is already in the mailbox. The throttler's
// answer (no reason) does not say that, so it counts as a failure.
function toOutcome(error: unknown): VerifyEmailRequestOutcome {
  const { kind, reason } = readFailure(error);
  if (kind === "conflict" && reason === ALREADY_VERIFIED_REASON) return "alreadyVerified";
  if (kind === "tooManyRequests" && reason === "RESEND_COOLDOWN") return "sentRecently";
  return "failed";
}

/**
 * VERIFY EMAIL of the owner's profile: asks the backend to mail a new verification code (`resendVerificationCode`),
 * shows a toast and opens the Email Verification page, where the user types the code. It never marks the email as
 * verified by itself (AC-27).
 *
 * - A code sent less than a minute ago: the page opens anyway, with an info toast.
 * - Already verified: the cached `me` learns it, so the button hides; the user stays.
 * - Any other failure: an error toast; the user stays and can try again.
 *
 * `pending` stays true from the click until the new page opens, and a second click in that time sends nothing.
 */
export function useVerifyEmailRequest() {
  const t = useTranslations("userDetails.profile.verifyEmail");
  const toast = useToast();
  const router = useRouter();
  const { cache } = useApolloClient();
  const [resend] = useMutation(ResendVerificationCodeDocument);
  const [pending, setPending] = useState(false);
  // A ref changes at once: two clicks in the same tick cannot both pass.
  const busy = useRef(false);

  function openVerifyPage() {
    // `busy` and `pending` stay set: the page is about to change.
    router.push(VERIFY_EMAIL_PATH);
  }

  function stay() {
    busy.current = false;
    setPending(false);
  }

  async function request() {
    if (busy.current) return;
    busy.current = true;
    setPending(true);

    let outcome: VerifyEmailRequestOutcome = "sent";
    try {
      await resend();
    } catch (error) {
      outcome = toOutcome(error);
    }

    switch (outcome) {
      case "sent":
        toast.success({ title: t("sent") });
        return openVerifyPage();
      case "sentRecently":
        toast.info({ title: t("sentRecently.title"), description: t("sentRecently.text") });
        return openVerifyPage();
      case "alreadyVerified":
        cache.updateQuery({ query: MeDocument }, (data) =>
          data?.me ? { me: { ...data.me, isVerified: true } } : data,
        );
        toast.info({ title: t("alreadyVerified") });
        return stay();
      case "failed":
        toast.error({ title: t("failed") });
        return stay();
    }
  }

  return { request, pending };
}

export type UseVerifyEmailRequestResult = ReturnType<typeof useVerifyEmailRequest>;
