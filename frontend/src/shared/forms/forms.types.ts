// One entry of `extensions.fieldErrors` in a BAD_USER_INPUT error (backend `common/validation`).
// `field` is a dotted path inside the mutation's input, e.g. "email" or "page.size".
// `reasons` is sent only by a rule that has stable codes (the backend README, "Errors"): one code for each
// entry of `messages`, in the same order.
export type ServerFieldError = {
  field: string;
  messages: string[];
  reasons?: string[] | undefined;
};
