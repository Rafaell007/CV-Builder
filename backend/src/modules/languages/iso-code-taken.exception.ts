import { ConflictException } from "@nestjs/common";

/**
 * CONFLICT with `extensions.reason` ISO_TAKEN (D16), so the UI can show the error under the ISO field. A taken name
 * is a plain CONFLICT without a reason.
 */
export class IsoCodeTakenException extends ConflictException {
  constructor() {
    super({ message: "ISO code already exists", reason: "ISO_TAKEN" });
  }
}
