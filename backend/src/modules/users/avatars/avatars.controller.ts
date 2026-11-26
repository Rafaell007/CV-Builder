import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Res,
  StreamableFile,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { type AuthUser, CurrentUser, requireUser } from "../../../common/auth";
import { AVATAR_FILE_FIELD, AVATAR_MAX_BYTES } from "./avatars.constants";
import { AvatarsService } from "./avatars.service";

/** The part of the Express response that `find` uses. Express provides it; tests can fake it. */
export interface HeaderResponse {
  setHeader(name: string, value: string): unknown;
}

/**
 * REST, not GraphQL, because the body is a file (D11). The browser calls `/api/...` on the frontend's own
 * origin, and the Next.js rewrite passes it on (D8), so the auth cookie goes along. Like every route, it needs a
 * signed-in user (the global `JwtAuthGuard`, 401 without), verified or not (D16).
 */
@Controller("api/users/:id/avatar")
export class AvatarsController {
  constructor(private readonly service: AvatarsService) {}

  /**
   * Any signed-in user may see an avatar. The URL from `User.avatarUrl` changes with every upload, so the
   * browser may keep the image for a year (`immutable`); `private`, because it is not public data.
   * `nosniff`: the browser must use the stored type and not guess one from the content.
   */
  @Get()
  async find(
    @Param("id", ParseUUIDPipe) id: string,
    @Res({ passthrough: true }) res: HeaderResponse,
  ): Promise<StreamableFile> {
    const { data, mimeType } = await this.service.find(id);
    // Set only after the avatar was found, so an error answer is never cached.
    res.setHeader("Cache-Control", "private, max-age=31536000, immutable");
    res.setHeader("X-Content-Type-Options", "nosniff");
    return new StreamableFile(data, { type: mimeType, length: data.length });
  }

  /**
   * Multipart with one file in the field `file`. Multer keeps it in memory and stops reading at 5 MB, which
   * Nest answers with 413. Other fields or a second file answer 400. The service checks the content (415).
   */
  @Post()
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseInterceptors(
    FileInterceptor(AVATAR_FILE_FIELD, {
      limits: { fileSize: AVATAR_MAX_BYTES, files: 1, fields: 0 },
    }),
  )
  async upload(
    @CurrentUser() actor: AuthUser | undefined,
    @Param("id", ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File | undefined,
  ): Promise<void> {
    const actorId = requireUser(actor).id;
    if (file === undefined) throw new BadRequestException("Choose an image to upload");
    // A copy on a plain ArrayBuffer, which Prisma's `Bytes` type needs (a Node Buffer may sit on a shared one).
    await this.service.upload(id, new Uint8Array(file.buffer), actorId);
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @CurrentUser() actor: AuthUser | undefined,
    @Param("id", ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.service.remove(id, requireUser(actor).id);
  }
}
