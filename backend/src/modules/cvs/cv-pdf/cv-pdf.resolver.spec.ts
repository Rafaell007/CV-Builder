import { UnauthorizedException } from "@nestjs/common";
import type { AuthUser } from "../../../common/auth";
import { VERIFIED_KEY } from "../../../common/auth/decorators";
import { GqlThrottlerGuard } from "../../../common/throttling";
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

    await expect(resolver.exportCvPdf(USER, { cvId: "cv-1", locale: "en" })).resolves.toBe(PDF);

    expect(service.export).toHaveBeenCalledWith(USER, "cv-1", "en");
  });

  it("passes the language of the PDF to the service", async () => {
    const { resolver, service } = setup();

    await resolver.exportCvPdf(USER, { cvId: "cv-1", locale: "pl" });

    expect(service.export).toHaveBeenCalledWith(USER, "cv-1", "pl");
  });

  it("refuses a call without a user", () => {
    const { resolver, service } = setup();

    expect(() => resolver.exportCvPdf(undefined, { cvId: "cv-1", locale: "en" })).toThrow(
      UnauthorizedException,
    );
    expect(service.export).not.toHaveBeenCalled();
  });

  it("has the rate limit, because a PDF costs much CPU", () => {
    const guards: unknown[] = Reflect.getMetadata(
      "__guards__",
      CvPdfResolver.prototype.exportCvPdf,
    );

    expect(guards).toContain(GqlThrottlerGuard);
  });

  it("does not need a verified email, because it only reads", () => {
    expect(Reflect.getMetadata(VERIFIED_KEY, CvPdfResolver.prototype.exportCvPdf)).toBeUndefined();
  });
});
