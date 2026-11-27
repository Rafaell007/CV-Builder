import type { ValidationError } from "@nestjs/common";
import type { FieldError } from "../errors";

/** Turns class-validator's error tree into one entry per invalid field, with dotted paths for nested inputs. */
export function flattenValidationErrors(errors: ValidationError[], parentPath = ""): FieldError[] {
  return errors.flatMap((error) => {
    const field = parentPath === "" ? error.property : `${parentPath}.${error.property}`;
    const own: FieldError[] = error.constraints
      ? [{ field, messages: Object.values(error.constraints) }]
      : [];
    return [...own, ...flattenValidationErrors(error.children ?? [], field)];
  });
}
