// One entry of `extensions.fieldErrors` in a BAD_USER_INPUT error (backend `common/validation`).
// `field` is a dotted path inside the mutation's input, e.g. "email" or "page.size".
export type ServerFieldError = {
  field: string;
  messages: string[];
};
