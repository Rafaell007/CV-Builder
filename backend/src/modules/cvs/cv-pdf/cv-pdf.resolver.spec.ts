import { UnauthorizedException } from "@nestjs/common";
import type { AuthUser } from "../../../common/auth";
import { VERIFIED_KEY } from "../../../common/auth/decorators";
import { Role } from "../../../generated/prisma/enums";
import { CvPdfResolver } from "./cv-pdf.resolver";
import type { CvPdfService } from "./cv-pdf.service";

const USER: AuthUser = { id: "user-1", role: Role.USER, isVerified: true };
const PDF = { fileName: "cv.pdf", base64: "JVBERg==" };

function setup() {
  const service = {
    export: jest.fn().mockResolvedValue(PDF),
  } as unknown as jest.Mocked<CvPdfService>;
  return { resolver: new CvPdfResolver(service), service };
}

describe("CvPdfResolver", () => {
  it("passes the signed-in user and the CV id to the service", async () => {
    const { resolver, service } = setup();

    await expect(resolver.exportCvPdf(USER, { cvId: "cv-1" })).resolves.toBe(PDF);

    expect(service.export).toHaveBeenCalledWith(USER, "cv-1");
  });

  it("refuses a call without a user", () => {
    const { resolver, service } = setup();

    expect(() => resolver.exportCvPdf(undefined, { cvId: "cv-1" })).toThrow(UnauthorizedException);
    expect(service.export).not.toHaveBeenCalled();
  });

  it("does not need a verified email, because it only reads", () => {
    expect(Reflect.getMetadata(VERIFIED_KEY, CvPdfResolver.prototype.exportCvPdf)).toBeUndefined();
  });
});
