import { ForbiddenException } from "@nestjs/common";

/** FORBIDDEN with `extensions.reason` EMAIL_NOT_VERIFIED, so the UI can offer to verify (D16). */
export class EmailNotVerifiedException extends ForbiddenException {
  constructor() {
    super({ message: "Verify your email to do this", reason: "EMAIL_NOT_VERIFIED" });
  }
}
