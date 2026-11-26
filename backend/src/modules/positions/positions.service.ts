import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { ListArgs, resolveSort, toSkipTake } from "../../common/pagination";
import { Prisma } from "../../generated/prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import type { CreatePositionInput } from "./dto/create-position.input";
import type { UpdatePositionInput } from "./dto/update-position.input";
import type { Position } from "./models/position";
import type { PositionPage } from "./models/position-page";

const SORT_FIELDS = ["name"] as const;

@Injectable()
export class PositionsService {
  constructor(private readonly prisma: PrismaService) {}

  async list({ search, sort, page }: ListArgs): Promise<PositionPage> {
    const { field, direction } = resolveSort(sort, SORT_FIELDS, {
      field: "name",
      direction: "asc",
    });
    const where: Prisma.PositionWhereInput = search
      ? { name: { contains: search, mode: "insensitive" } }
      : {};
    const [items, total] = await this.prisma.$transaction([
      this.prisma.position.findMany({
        where,
        select: { id: true, name: true },
        orderBy: [{ [field]: direction }, { id: "asc" }],
        ...toSkipTake(page),
      }),
      this.prisma.position.count({ where }),
    ]);
    return { items, total };
  }

  /** Every position, sorted by name, for the Position select of the user forms (no pages). */
  listOptions(): Promise<Position[]> {
    return this.prisma.position.findMany({
      select: { id: true, name: true },
      orderBy: [{ name: "asc" }, { id: "asc" }],
    });
  }

  async create({ name }: CreatePositionInput): Promise<Position> {
    try {
      return await this.prisma.position.create({
        data: { name },
        select: { id: true, name: true },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new ConflictException("Position already exists");
      }
      throw error;
    }
  }

  async update({ id, name }: UpdatePositionInput): Promise<Position> {
    try {
      return await this.prisma.position.update({
        where: { id },
        data: { name },
        select: { id: true, name: true },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2002") throw new ConflictException("Position already exists");
        if (error.code === "P2025") throw new NotFoundException("Position not found");
      }
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.prisma.position.delete({ where: { id } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2003") {
          throw new ConflictException("Position cannot be deleted because it is currently in use");
        }
        if (error.code === "P2025") throw new NotFoundException("Position not found");
      }
      throw error;
    }
  }
}
