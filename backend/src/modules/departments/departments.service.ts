import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { ListArgs, resolveSort, toSkipTake } from "../../common/pagination";
import { Prisma } from "../../generated/prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import type { CreateDepartmentInput } from "./dto/create-department.input";
import type { UpdateDepartmentInput } from "./dto/update-department.input";
import type { Department } from "./models/department";
import type { DepartmentPage } from "./models/department-page";

const SORT_FIELDS = ["name"] as const;

@Injectable()
export class DepartmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async list({ search, sort, page }: ListArgs): Promise<DepartmentPage> {
    const { field, direction } = resolveSort(sort, SORT_FIELDS, {
      field: "name",
      direction: "asc",
    });
    const where: Prisma.DepartmentWhereInput = search
      ? { name: { contains: search, mode: "insensitive" } }
      : {};
    const [items, total] = await this.prisma.$transaction([
      this.prisma.department.findMany({
        where,
        select: { id: true, name: true },
        orderBy: [{ [field]: direction }, { id: "asc" }],
        ...toSkipTake(page),
      }),
      this.prisma.department.count({ where }),
    ]);
    return { items, total };
  }

  async create({ name }: CreateDepartmentInput): Promise<Department> {
    try {
      return await this.prisma.department.create({
        data: { name },
        select: { id: true, name: true },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new ConflictException("Department already exists");
      }
      throw error;
    }
  }

  async update({ id, name }: UpdateDepartmentInput): Promise<Department> {
    try {
      return await this.prisma.department.update({
        where: { id },
        data: { name },
        select: { id: true, name: true },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2002") throw new ConflictException("Department already exists");
        if (error.code === "P2025") throw new NotFoundException("Department not found");
      }
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.prisma.department.delete({ where: { id } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2003") {
          throw new ConflictException(
            "Department cannot be deleted because it is currently in use",
          );
        }
        if (error.code === "P2025") throw new NotFoundException("Department not found");
      }
      throw error;
    }
  }
}
