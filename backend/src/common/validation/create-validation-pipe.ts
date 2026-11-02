import { ValidationPipe } from "@nestjs/common";
import { ValidationFailedException } from "../errors";
import { flattenValidationErrors } from "./flatten-validation-errors";

/** The global pipe: validates every `@InputType` / `@ArgsType` with class-validator and reports field errors. */
export function createValidationPipe(): ValidationPipe {
  return new ValidationPipe({
    transform: true, // hands resolvers real class instances, so defaults and @Type() apply
    whitelist: true, // strips properties that have no validation decorator ...
    forbidNonWhitelisted: true, // ... and fails loudly instead, so a @Field without a validator is noticed
    exceptionFactory: (errors) => new ValidationFailedException(flattenValidationErrors(errors)),
  });
}
