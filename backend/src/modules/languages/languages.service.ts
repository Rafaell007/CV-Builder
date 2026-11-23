import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { ListArgs, resolveSort, toSkipTake } from "../../common/pagination";
import { Prisma } from "../../generated/prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import type { CreateLanguageInput } from "./dto/create-language.input";
import type { UpdateLanguageInput } from "./dto/update-language.input";
import { IsoCodeTakenException } from "./iso-code-taken.exception";
import type { Language } from "./models/language";
import type { LanguagePage } from "./models/language-page";

const SORT_FIELDS = ["name", "iso"] as const;
const LANGUAGE_SELECT = { id: true, name: true, iso: true, nativeName: true } as const;

/** The unique index of the ISO code; its name comes from Prisma's naming of `@unique` on `Language.iso`. */
const ISO_INDEX = "Language_iso_key";

/**
 * The name of the unique index that failed (P2002). Prisma 7 with the pg adapter gives no field names,
 * only the index, in `meta.driverAdapterError.cause.constraint.index`.
 */
function failedUniqueIndex(error: Prisma.PrismaClientKnownRequestError): string | undefined {
  const meta = error.meta as
    { driverAdapterError?: { cause?: { constraint?: { index?: string } } } } | undefined;
  return meta?.driverAdapterError?.cause?.constraint?.index;
}

@Injectable()
export class LanguagesService {
  constructor(private readonly prisma: PrismaService) {}

  async list({ search, sort, page }: ListArgs): Promise<LanguagePage> {
    const { field, direction } = resolveSort(sort, SORT_FIELDS, {
      field: "name",
      direction: "asc",
    });
    const where: Prisma.LanguageWhereInput = search
      ? { name: { contains: search, mode: "insensitive" } }
      : {};
    const [items, total] = await this.prisma.$transaction([
      this.prisma.language.findMany({
        where,
        select: LANGUAGE_SELECT,
        orderBy: [{ [field]: direction }, { id: "asc" }],
        ...toSkipTake(page),
      }),
      this.prisma.language.count({ where }),
    ]);
    return { items, total };
  }

  async create(input: CreateLanguageInput): Promise<Language> {
    try {
      return await this.prisma.language.create({ data: input, select: LANGUAGE_SELECT });
    } catch (error) {
      throw await this.toWriteError(error, input.iso);
    }
  }

  async update({ id, ...data }: UpdateLanguageInput): Promise<Language> {
    try {
      return await this.prisma.language.update({ where: { id }, data, select: LANGUAGE_SELECT });
    } catch (error) {
      throw await this.toWriteError(error, data.iso, id);
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.prisma.language.delete({ where: { id } });
    } catch (error) {
      // The only link to a language is UserLanguage (Restrict), so P2003 means a user has it (D18).
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
        throw new ConflictException("Language cannot be deleted because it is currently in use");
      }
      throw toNotFoundError(error);
    }
  }

  /**
   * Turns the database errors of a create or update into the API errors of page 19; anything else is
   * returned as is. `id` is the language being updated, left out on create.
   */
  private async toWriteError(error: unknown, iso: string, id?: string): Promise<unknown> {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return (await this.isIsoDuplicate(error, iso, id))
        ? new IsoCodeTakenException()
        : new ConflictException("Language already exists");
    }
    return toNotFoundError(error);
  }

  /** Whether a unique-constraint error (P2002) is about the ISO code rather than the name. */
  private async isIsoDuplicate(
    error: Prisma.PrismaClientKnownRequestError,
    iso: string,
    id?: string,
  ): Promise<boolean> {
    const index = failedUniqueIndex(error);
    if (index !== undefined) return index === ISO_INDEX;
    // The index name sits in an undocumented part of the error, so a Prisma update may move it. Then
    // ask the database whether another language already has this ISO code.
    const other = await this.prisma.language.findFirst({
      where: { iso, ...(id && { id: { not: id } }) },
      select: { id: true },
    });
    return other !== null;
  }
}

/** P2025 (no such row) becomes NOT_FOUND; any other error is returned as is. */
function toNotFoundError(error: unknown): unknown {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025"
    ? new NotFoundException("Language not found")
    : error;
}
