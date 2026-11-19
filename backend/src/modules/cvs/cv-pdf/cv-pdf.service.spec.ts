import { InternalServerErrorException, Logger, NotFoundException } from "@nestjs/common";
import type { AuthUser } from "../../../common/auth";
import { Role } from "../../../generated/prisma/enums";
import type { CvPreviewService } from "../cv-preview/cv-preview.service";
import type { CvPreview } from "../cv-preview/models/cv-preview";
import type { CvPdfRenderer } from "./cv-pdf-renderer";
import { CvPdfService } from "./cv-pdf.service";

const USER: AuthUser = { id: "user-1", role: Role.USER, isVerified: true };
const PREVIEW: CvPreview = {
  cvId: "cv-1",
  name: "Senior Developer",
  education: "",
  description: "",
  fullName: null,
  position: null,
  languages: [],
  domains: [],
  skillGroups: [],
  projects: [],
};

const preview = { get: jest.fn() };
const renderer = { render: jest.fn() };
const service = new CvPdfService(
  preview as unknown as CvPreviewService,
  renderer as unknown as CvPdfRenderer,
);

beforeEach(() => {
  jest.clearAllMocks();
  preview.get.mockResolvedValue(PREVIEW);
  renderer.render.mockResolvedValue(Buffer.from("%PDF-test"));
});

describe("CvPdfService.export", () => {
  it("returns the file name from the CV name and the file as base64", async () => {
    const result = await service.export(USER, "cv-1");

    expect(result).toEqual({
      fileName: "senior-developer.pdf",
      base64: Buffer.from("%PDF-test").toString("base64"),
    });
  });

  it("reads the data with the access check of the preview, for the same user and CV (AC-30)", async () => {
    await service.export(USER, "cv-1");

    expect(preview.get).toHaveBeenCalledWith(USER, "cv-1");
  });

  it("makes no PDF when the CV may not be read (AC-49)", async () => {
    preview.get.mockRejectedValue(new NotFoundException("CV not found"));

    await expect(service.export(USER, "cv-1")).rejects.toBeInstanceOf(NotFoundException);
    expect(renderer.render).not.toHaveBeenCalled();
  });

  it("hides the details when the PDF step fails (AC-47)", async () => {
    renderer.render.mockRejectedValue(new Error("ENOENT: secret/path/Roboto.ttf"));
    const log = jest.spyOn(Logger.prototype, "error").mockImplementation(() => undefined);

    const failure = await service.export(USER, "cv-1").catch((error: unknown) => error);

    expect(failure).toBeInstanceOf(InternalServerErrorException);
    expect((failure as Error).message).toBe("The PDF could not be generated");
    expect(log).toHaveBeenCalled();
  });
});
