import { BadRequestException } from "@nestjs/common";

/**
 * One invalid input field. `field` is a dotted path inside the input, e.g. `page.size` or `skills.0.mastery`.
 * `reasons` is optional. A service that sets it sends one stable code for each entry of `messages`, in the same
 * order, so a client can show its own translated text instead of the English `messages`.
 */
export interface FieldError {
  field: string;
  messages: string[];
  reasons?: string[];
}

/** Thrown for invalid input; the exception filter returns it as BAD_USER_INPUT with `extensions.fieldErrors`. */
export class ValidationFailedException extends BadRequestException {
  constructor(readonly fieldErrors: FieldError[]) {
    super("Validation failed");
  }
}
