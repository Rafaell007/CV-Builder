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
  Query,
  Res,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { Throttle } from "@nestjs/throttler";
import { type AuthUser, CurrentUser, requireUser } from "../../../common/auth";
import { GqlThrottlerGuard } from "../../../common/throttling";
import { AvatarActorGuard } from "./avatar-actor.guard";
import { avatarVersion } from "./avatar-url.utils";
import {
  AVATAR_FILE_FIELD,
  AVATAR_MAX_BYTES,
  AVATAR_READ_LIMIT,
  AVATAR_READ_TTL_MS,
} from "./avatars.constants";
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
   * Any signed-in user may see an avatar. `private`, because it is not public data. `nosniff`: the browser must
   * use the stored type and not guess one from the content. The address from `User.avatarUrl` carries the
   * current version (`?v=`) and changes with every upload, so the browser may keep that image for a year
   * (`immutable`). Any other address (no `v`, an old one, a link made by hand) gets `no-cache`: the browser asks
   * again each time, so it never keeps an old photo under an address that stays the same.
   */
  @Get()
  @UseGuards(GqlThrottlerGuard)
  @Throttle({ default: { limit: AVATAR_READ_LIMIT, ttl: AVATAR_READ_TTL_MS } })
  async find(
    @Param("id", ParseUUIDPipe) id: string,
    @Query("v") version: string | undefined,
    @Res({ passthrough: true }) res: HeaderResponse,
  ): Promise<StreamableFile> {
    const { data, mimeType, updatedAt } = await this.service.find(id);
    // Set only after the avatar was found, so an error answer is never cached.
    const current = version === avatarVersion(updatedAt);
    res.setHeader(
      "Cache-Control",
      current ? "private, max-age=31536000, immutable" : "private, no-cache",
    );
    res.setHeader("X-Content-Type-Options", "nosniff");
    return new StreamableFile(data, { type: mimeType, length: data.length });
  }

  /**
   * Multipart with one file in the field `file`. Guards run before the interceptor: too many calls answer 429
   * and a user who is neither the owner nor an admin answers 403, both before the file is read. Then Multer keeps
   * the file in memory and stops reading at 5 MB, which Nest answers with 413. Other fields or a second file
   * answer 400. The service checks the actor again under the row lock, then the content (415).
   */
  @Post()
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(GqlThrottlerGuard, AvatarActorGuard)
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
  @UseGuards(GqlThrottlerGuard, AvatarActorGuard)
  async remove(
    @CurrentUser() actor: AuthUser | undefined,
    @Param("id", ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.service.remove(id, requireUser(actor).id);
  }
}
