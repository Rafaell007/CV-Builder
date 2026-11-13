import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import type { AuthUser } from "../../common/auth";
import { ValidationFailedException } from "../../common/errors";
import { resolveSort, toSkipTake } from "../../common/pagination";
import type { Prisma } from "../../generated/prisma/client";
import { Role } from "../../generated/prisma/enums";
import { PrismaService } from "../../prisma/prisma.service";
import type { CreateCvInput } from "./dto/create-cv.input";
import type { CvsArgs } from "./dto/cvs.args";
import type { UpdateCvInput } from "./dto/update-cv.input";
import type { Cv } from "./models/cv";
import type { CvPage } from "./models/cv-page";

const SORT_FIELDS = ["name"] as const;

const CV_WITH_OWNER = { include: { user: { select: { email: true } } } } as const;
type CvWithOwner = Prisma.CvGetPayload<typeof CV_WITH_OWNER>;

/**
 * Own CVs for a user, all CVs for an admin (cvs page AC). The owner of a CV always comes from the
 * signed-in user, except for an admin who names another user.
 */
@Injectable()
export class CvsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(user: AuthUser, { search, sort, page, userId }: CvsArgs): Promise<CvPage> {
    const isAdmin = user.role === Role.ADMIN;
    if (!isAdmin && userId !== undefined && userId !== user.id) throw forbiddenCv();

    const { field, direction } = resolveSort(sort, SORT_FIELDS, {
      field: "name",
      direction: "asc",
    });
    const where: Prisma.CvWhereInput = {
      // A user sees only their own CVs, whatever the arguments say.
      ...(isAdmin ? (userId === undefined ? {} : { userId }) : { userId: user.id }),
      ...(search ? { OR: searchConditions(search, isAdmin) } : {}),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.cv.findMany({
        where,
        // The id keeps the order stable between pages when names are equal.
        orderBy: [{ [field]: direction }, { id: "asc" }],
        ...toSkipTake(page),
        ...CV_WITH_OWNER,
      }),
      this.prisma.cv.count({ where }),
    ]);
    return { items: items.map(toCv), total };
  }

  async get(user: AuthUser, id: string): Promise<Cv> {
    return toCv(await this.findAccessible(user, id));
  }

  async create(user: AuthUser, { userId, ...data }: CreateCvInput): Promise<Cv> {
    const ownerId = userId ?? user.id;
    if (ownerId !== user.id) {
      if (user.role !== Role.ADMIN) throw forbiddenCv();
      const owner = await this.prisma.user.findUnique({
        where: { id: ownerId },
        select: { id: true },
      });
      if (owner === null) {
        throw new ValidationFailedException([{ field: "userId", messages: ["User not found"] }]);
      }
    }
    return toCv(
      await this.prisma.cv.create({ data: { ...data, userId: ownerId }, ...CV_WITH_OWNER }),
    );
  }

  async update(user: AuthUser, { id, ...data }: UpdateCvInput): Promise<Cv> {
    await this.findAccessible(user, id);
    return toCv(
      await this.prisma.cv
        .update({ where: { id }, data, ...CV_WITH_OWNER })
        .catch(rethrowMissingCv),
    );
  }

  async delete(user: AuthUser, id: string): Promise<Cv> {
    await this.findAccessible(user, id);
    return toCv(
      await this.prisma.cv.delete({ where: { id }, ...CV_WITH_OWNER }).catch(rethrowMissingCv),
    );
  }

  /**
   * Throws NOT_FOUND unless the user may use the CV. Code that works on the data of a CV (for
   * example its projects) calls this first, so the ownership rule lives in one place. It returns
   * the id of the owner, for rules that depend on the owner (the skills the owner has).
   */
  async assertAccessible(user: AuthUser, id: string): Promise<{ ownerId: string }> {
    const { userId } = await this.findAccessible(user, id);
    return { ownerId: userId };
  }

  /**
   * The CV, if the user may use it. Someone else's CV answers NOT_FOUND, the same as a missing one,
   * so a user cannot find out which ids exist by changing the id in a request.
   */
  private async findAccessible(user: AuthUser, id: string): Promise<CvWithOwner> {
    const cv = await this.prisma.cv.findUnique({ where: { id }, ...CV_WITH_OWNER });
    if (cv === null || (user.role !== Role.ADMIN && cv.userId !== user.id)) {
      throw new NotFoundException("CV not found");
    }
    return cv;
  }
}

/** Users search by name; admins also by the email of the owner. */
function searchConditions(search: string, isAdmin: boolean): Prisma.CvWhereInput[] {
  const contains = { contains: search, mode: "insensitive" as const };
  return isAdmin ? [{ name: contains }, { user: { email: contains } }] : [{ name: contains }];
}

/**
 * Another request can delete the CV between the access check and the write. Prisma then throws
 * P2025 (record not found). The user gets NOT_FOUND, not a server error.
 */
function rethrowMissingCv(error: unknown): never {
  if (error instanceof Error && "code" in error && error.code === "P2025") {
    throw new NotFoundException("CV not found");
  }
  throw error;
}

function forbiddenCv(): ForbiddenException {
  return new ForbiddenException("You cannot access the CVs of other users");
}

function toCv({ user, ...cv }: CvWithOwner): Cv {
  return { ...cv, ownerEmail: user.email };
}
