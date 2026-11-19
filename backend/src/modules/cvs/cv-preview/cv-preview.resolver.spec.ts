import { UnauthorizedException } from "@nestjs/common";
import type { AuthUser } from "../../../common/auth";
import { VERIFIED_KEY } from "../../../common/auth/decorators";
import { Role } from "../../../generated/prisma/enums";
import { CvPreviewResolver } from "./cv-preview.resolver";
import type { CvPreviewService } from "./cv-preview.service";

const USER: AuthUser = { id: "user-1", role: Role.USER, isVerified: true };
const PREVIEW = { cvId: "cv-1" };

function setup() {
  const service = {
    get: jest.fn().mockResolvedValue(PREVIEW),
  } as unknown as jest.Mocked<CvPreviewService>;
  return { resolver: new CvPreviewResolver(service), service };
}

describe("CvPreviewResolver", () => {
  it("passes the signed-in user and the CV id to the service", async () => {
    const { resolver, service } = setup();

    await expect(resolver.cvPreview(USER, { cvId: "cv-1", locale: "en" })).resolves.toBe(PREVIEW);

    expect(service.get).toHaveBeenCalledWith(USER, "cv-1", "en");
  });

  it("passes the language to the service", async () => {
    const { resolver, service } = setup();

    await resolver.cvPreview(USER, { cvId: "cv-1", locale: "pl" });

    expect(service.get).toHaveBeenCalledWith(USER, "cv-1", "pl");
  });

  it("refuses a call without a user", () => {
    const { resolver, service } = setup();

    expect(() => resolver.cvPreview(undefined, { cvId: "cv-1", locale: "en" })).toThrow(
      UnauthorizedException,
    );
    expect(service.get).not.toHaveBeenCalled();
  });

  it("does not need a verified email, because it only reads", () => {
    expect(
      Reflect.getMetadata(VERIFIED_KEY, CvPreviewResolver.prototype.cvPreview),
    ).toBeUndefined();
  });
});
