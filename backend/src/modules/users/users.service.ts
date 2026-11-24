import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { type FieldError, ValidationFailedException } from "../../common/errors";
import { escapeLike, ListArgs, resolveSort, toSkipTake } from "../../common/pagination";
import { Prisma } from "../../generated/prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { EMAIL_TAKEN_REASON } from "../auth/auth.service";
import { Role } from "../auth/models/role.enum";
import { hashPassword } from "../auth/password";
import type { CreateUserInput } from "./dto/create-user.input";
import type { UpdateUserInput } from "./dto/update-user.input";
import type { User } from "./models/user";
import type { UserPage } from "./models/user-page";

/** `extensions.reason` of the `CONFLICT` when an admin removes their own Admin role (D24). */
export const OWN_ROLE_REASON = "OWN_ROLE";

/** `extensions.reason` of the `CONFLICT` when an admin deletes themselves (D24). */
export const SELF_DELETE_REASON = "SELF_DELETE";

/** The columns of the Users table that sort (users page, Sorting). Any other field is refused. */
const SORT_FIELDS = ["firstName", "lastName", "department", "position"] as const;
type UserSortField = (typeof SORT_FIELDS)[number];

/** What a `User` shows. Never the password hash or session data (users page AC-18, AC-26). */
const USER_SELECT = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  role: true,
  department: { select: { id: true, name: true } },
  position: { select: { id: true, name: true } },
} as const satisfies Prisma.UserSelect;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * One page of users, searched, sorted and counted in the database (users page AC-5 to AC-10). A user
   * without a name, department or position sorts by PostgreSQL's default: last in A→Z, first in Z→A.
   */
  async list({ search, sort, page }: ListArgs): Promise<UserPage> {
    const { field, direction } = resolveSort(sort, SORT_FIELDS, {
      field: "firstName",
      direction: "asc",
    });
    const where = searchWhere(search);
    const [items, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        select: USER_SELECT,
        orderBy: [orderByField(field, direction), { id: "asc" }],
        ...toSkipTake(page),
      }),
      this.prisma.user.count({ where }),
    ]);
    return { items, total };
  }

  /** One user for User Details (`user(id)`); `NOT_FOUND` when there is no such user. */
  async findOne(id: string): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { id }, select: USER_SELECT });
    if (user === null) throw new NotFoundException("User not found");
    return user;
  }

  /**
   * An admin creates a user (users page AC-14): verified at once (D16), the password stored only as an argon2
   * hash (AC-17). The unique index on `email` decides between two parallel requests; the loser gets `CONFLICT`
   * with reason `EMAIL_TAKEN`, like sign-up.
   */
  async create({ password, ...data }: CreateUserInput): Promise<User> {
    // The cheap check first: no slow hashing for a form that fails anyway.
    await this.assertDepartmentAndPositionExist(data);
    const passwordHash = await hashPassword(password);
    try {
      return await this.prisma.user.create({
        data: { ...data, passwordHash, isVerified: true },
        select: USER_SELECT,
      });
    } catch (error) {
      throw await this.toWriteError(error, data);
    }
  }

  /**
   * An admin (`actorId`) updates a user's names, department, position and role (users page AC-27). Email and
   * password are not part of the input. `NOT_FOUND` when the user does not exist (any more).
   * D24: an admin cannot remove their own Admin role (`OWN_ROLE`). The change is saved while the actor and the
   * target are locked (`lockActorAndTarget`), which also keeps the last admin: see there.
   * The checks run from the most general to the most specific: may the actor do this (`FORBIDDEN`), does the
   * user exist (`NOT_FOUND`), D24 (`CONFLICT`), then the fields (`BAD_USER_INPUT`). So a user deleted meanwhile
   * gives "User not found", not an error under a field of a form for a user who is gone.
   */
  async update({ id: sentId, ...data }: UpdateUserInput, actorId: string): Promise<User> {
    const id = canonicalId(sentId);
    try {
      return await this.prisma.$transaction(async (tx) => {
        await lockActorAndTarget(tx, id, actorId);
        // The lock proved that the actor is an admin, so this is a demotion of themselves.
        if (id === actorId && data.role !== Role.ADMIN) {
          throw new ConflictException({
            message: "You cannot remove your own Admin role",
            reason: OWN_ROLE_REASON,
          });
        }
        await this.assertDepartmentAndPositionExist(data, tx);
        return tx.user.update({ where: { id }, data, select: USER_SELECT });
      });
    } catch (error) {
      throw await this.toWriteError(error, data);
    }
  }

  /**
   * An admin (`actorId`) deletes a user and, by the database cascade, everything the user owns (D13). The
   * user's session ends at once: the auth guard reads the user from the database on every request.
   * D24: an admin cannot delete themselves (`SELF_DELETE`). The delete runs while the actor and the target are
   * locked, like `update`, and its checks run in the same order: `FORBIDDEN`, `NOT_FOUND`, then D24 (`CONFLICT`).
   */
  async delete(sentId: string, actorId: string): Promise<void> {
    const id = canonicalId(sentId);
    try {
      await this.prisma.$transaction(async (tx) => {
        await lockActorAndTarget(tx, id, actorId);
        if (id === actorId) {
          throw new ConflictException({
            message: "You cannot delete yourself",
            reason: SELF_DELETE_REASON,
          });
        }
        // The row is locked, so it still exists here: no P2025 to map.
        await tx.user.delete({ where: { id } });
      });
    } catch (error) {
      throw toTransactionConflict(error);
    }
  }

  /**
   * `BAD_USER_INPUT` with a field error under each of `departmentId` and `positionId` that points to nothing,
   * so the form shows the message under that field. `db` is the transaction when there is one.
   */
  private async assertDepartmentAndPositionExist(
    { departmentId, positionId }: DepartmentAndPosition,
    db: Prisma.TransactionClient = this.prisma,
  ): Promise<void> {
    const [department, position] = await Promise.all([
      db.department.findUnique({ where: { id: departmentId }, select: { id: true } }),
      db.position.findUnique({ where: { id: positionId }, select: { id: true } }),
    ]);
    const errors: FieldError[] = [];
    if (department === null) {
      errors.push({ field: "departmentId", messages: ["Department not found"] });
    }
    if (position === null) errors.push({ field: "positionId", messages: ["Position not found"] });
    if (errors.length > 0) throw new ValidationFailedException(errors);
  }

  /**
   * Turns the database errors of a write into API errors; anything else is returned as is.
   * - P2002: the only unique column a write sets is `email` (create only), so the email is taken.
   * - P2003: the department or position was deleted after the check. Checking again names the field.
   * - P2034, P2028: another request changed the same rows at the same time, or the transaction could not
   *   finish in time (see `toTransactionConflict`).
   */
  private async toWriteError(error: unknown, ids: DepartmentAndPosition): Promise<unknown> {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError)) return error;
    if (TRANSACTION_CONFLICT_CODES.has(error.code)) return toTransactionConflict(error);
    if (error.code === "P2002") {
      return new ConflictException({
        message: "An account with this email already exists",
        reason: EMAIL_TAKEN_REASON,
      });
    }
    if (error.code === "P2003") {
      try {
        await this.assertDepartmentAndPositionExist(ids);
      } catch (fieldError) {
        return fieldError;
      }
    }
    return error;
  }
}

type DepartmentAndPosition = Pick<CreateUserInput, "departmentId" | "positionId">;

/**
 * Transaction errors after which nothing was saved, so the admin can simply try again:
 * - P2034: a deadlock or a write conflict; PostgreSQL stopped this transaction because a parallel one needs the
 *   same rows. Example: a user is deleted while their browser refreshes its session token.
 * - P2028: Prisma rolled the transaction back because it did not finish in time (default 5 s), or got no free
 *   database connection in time (default 2 s). Example: many requests wait for the same locked user at once.
 */
const TRANSACTION_CONFLICT_CODES: ReadonlySet<string> = new Set(["P2034", "P2028"]);

/** A transaction error from `TRANSACTION_CONFLICT_CODES` becomes a `CONFLICT` to retry, not a server error. Any other error is returned as is. */
function toTransactionConflict(error: unknown): unknown {
  return error instanceof Prisma.PrismaClientKnownRequestError &&
    TRANSACTION_CONFLICT_CODES.has(error.code)
    ? new ConflictException("The user was changed at the same time. Try again")
    : error;
}

/**
 * A UUID as PostgreSQL returns it: lower case. The input checks accept "6F1D3C52-…" too, and the SQL
 * matches it, but a plain `===` with an id read from the database (the locked rows, the actor) would not.
 */
function canonicalId(id: string): string {
  return id.toLowerCase();
}

/**
 * Locks the acting admin and the target until the transaction ends, then checks both as they are now. A
 * parallel request that changes or deletes one of them waits here until this one commits, and then reads the
 * new data. One statement in id order locks the rows in the same order in every request, so two requests cannot
 * each hold a row the other one waits for (a deadlock).
 * `FOR NO KEY UPDATE`, not `FOR UPDATE`: it still blocks every other lock of this function and every update or
 * delete of the rows, but not the light lock that saving a row which points to the user takes (a refresh token
 * on sign-in or refresh), so an admin's edit does not hold up anyone's session.
 * - `FORBIDDEN` when the actor is no longer an admin: the guard checked the role before the request waited
 *   here, and a parallel request may have demoted or deleted the actor since.
 * - `NOT_FOUND` when the target does not exist.
 *
 * This keeps at least one admin (D24) without counting them: a change goes through only while its actor is an
 * admin, the actor cannot demote or delete themselves (`OWN_ROLE`, `SELF_DELETE`), and the lock keeps the actor
 * an admin until the change commits. So after every change, its actor is still an admin.
 */
async function lockActorAndTarget(
  tx: Prisma.TransactionClient,
  id: string,
  actorId: string,
): Promise<void> {
  // A tagged template: Prisma sends the ids as query parameters, never as SQL text.
  const rows = await tx.$queryRaw<LockedUser[]>`
    SELECT id, role FROM "User"
    WHERE id = ${id}::uuid OR id = ${actorId}::uuid
    ORDER BY id
    FOR NO KEY UPDATE`;
  const actor = rows.find((row) => row.id === actorId);
  if (actor?.role !== Role.ADMIN) throw new ForbiddenException("You are not allowed to do this");
  if (!rows.some((row) => row.id === id)) throw new NotFoundException("User not found");
}

interface LockedUser {
  id: string;
  role: Role;
}

/**
 * Each word of the search must be in the first name, the last name or the email, without regard to letter
 * case. So "alpha lim" finds Alpha Lima, and an empty search finds everyone.
 */
function searchWhere(search: string | null | undefined): Prisma.UserWhereInput {
  const words = search?.trim().split(/\s+/).filter(Boolean) ?? [];
  return {
    AND: words.map((word) => {
      const contains = { contains: escapeLike(word), mode: "insensitive" } as const;
      return { OR: [{ firstName: contains }, { lastName: contains }, { email: contains }] };
    }),
  };
}

/** Department and position sort by their name; the names sort by themselves. */
function orderByField(
  field: UserSortField,
  direction: Prisma.SortOrder,
): Prisma.UserOrderByWithRelationInput {
  switch (field) {
    case "department":
      return { department: { name: direction } };
    case "position":
      return { position: { name: direction } };
    default:
      return { [field]: direction };
  }
}
