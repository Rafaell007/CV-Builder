import {
  HttpStatus,
  Injectable,
  NotFoundException,
  UnsupportedMediaTypeException,
} from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { toTransactionConflict } from "../../../common/errors";
import { canonicalId, lockActorAndTarget } from "../user-lock";
import { UNSUPPORTED_FILE_TYPE_REASON } from "./avatars.constants";
import { detectImageType } from "./image-type.utils";

/** A stored avatar, as `GET /api/users/:id/avatar` sends it. */
export interface StoredAvatar {
  data: Uint8Array;
  mimeType: string;
  /** Time of the last upload: the version in `User.avatarUrl` (`?v=`). */
  updatedAt: Date;
}

/**
 * The avatar of a user, stored in PostgreSQL (D11). Every signed-in user may see it (user profile page
 * AC-3); only the owner or an admin may change or remove it (PLAN.md §7). The writes lock the actor and the
 * user like `UsersService.updateProfile`, with the same order of checks: `FORBIDDEN` (neither the owner nor
 * an admin, also for an unknown user, so a user cannot probe ids), `NOT_FOUND`, then the file.
 */
@Injectable()
export class AvatarsService {
  constructor(private readonly prisma: PrismaService) {}

  /** The avatar of a user; `NOT_FOUND` when the user has none (or does not exist). */
  async find(userId: string): Promise<StoredAvatar> {
    const avatar = await this.prisma.avatar.findUnique({
      where: { userId },
      select: { data: true, mimeType: true, updatedAt: true },
    });
    if (avatar === null) throw new NotFoundException("Avatar not found");
    return avatar;
  }

  /**
   * Saves `content` as the user's avatar, replacing the old one. The type comes from the file content, never
   * from the name or the type the browser sent. A file that is not a PNG, JPG or GIF image gets 415 and
   * keeps the old avatar (AC-23); the size limit is checked before, while the upload is read.
   */
  async upload(
    sentUserId: string,
    content: Uint8Array<ArrayBuffer>,
    actorId: string,
  ): Promise<void> {
    const userId = canonicalId(sentUserId);
    try {
      await this.prisma.$transaction(async (tx) => {
        await lockActorAndTarget(tx, userId, actorId, { ownerMayAct: true });
        const mimeType = detectImageType(content);
        if (mimeType === undefined) {
          throw new UnsupportedMediaTypeException({
            statusCode: HttpStatus.UNSUPPORTED_MEDIA_TYPE,
            message: "Only PNG, JPG or GIF images are allowed",
            reason: UNSUPPORTED_FILE_TYPE_REASON,
          });
        }
        await tx.avatar.upsert({
          where: { userId },
          create: { userId, data: content, mimeType },
          update: { data: content, mimeType },
        });
      });
    } catch (error) {
      throw toTransactionConflict(error);
    }
  }

  /** Removes the user's avatar; a user without one is fine, so removing twice is not an error. */
  async remove(sentUserId: string, actorId: string): Promise<void> {
    const userId = canonicalId(sentUserId);
    try {
      await this.prisma.$transaction(async (tx) => {
        await lockActorAndTarget(tx, userId, actorId, { ownerMayAct: true });
        await tx.avatar.deleteMany({ where: { userId } });
      });
    } catch (error) {
      throw toTransactionConflict(error);
    }
  }
}
