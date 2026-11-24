import { CombinedGraphQLErrors } from "@apollo/client";
import { z } from "zod";
import type { ServerFieldError } from "../forms.types";

// `extensions.code` of a request the server rejected as invalid input (PLAN D7).
export const BAD_USER_INPUT = "BAD_USER_INPUT";

// The server's answer is external data, so its shape is checked before use (PLAN §5.7).
const serverFieldErrorsSchema = z.array(
  z.object({
    field: z.string(),
    messages: z.array(z.string()),
    // Codes are optional, so a malformed list must not hide the field error itself.
    reasons: z.array(z.string()).optional().catch(undefined),
  }),
);

// The field errors of a failed request; empty for any other error or an answer without valid field errors.
export function getServerFieldErrors(error: unknown): ServerFieldError[] {
  if (!CombinedGraphQLErrors.is(error)) return [];

  return error.errors.flatMap(({ extensions }) => {
    if (extensions?.["code"] !== BAD_USER_INPUT) return [];
    const parsed = serverFieldErrorsSchema.safeParse(extensions["fieldErrors"]);
    return parsed.success ? parsed.data : [];
  });
}
