import { ValidationPipe } from "@nestjs/common";
import { ValidationFailedException } from "../errors";
import { flattenValidationErrors } from "./flatten-validation-errors";

/** The global pipe: validates every `@InputType` / `@ArgsType` with class-validator and reports field errors. */
export function createValidationPipe(): ValidationPipe {
  return new ValidationPipe({
    transform: true, // hands resolvers real class instances, so defaults and @Type() apply
    whitelist: true, // drops properties that have no validation decorator
    exceptionFactory: (errors) => new ValidationFailedException(flattenValidationErrors(errors)),
  });
}
