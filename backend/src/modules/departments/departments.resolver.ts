import { ParseUUIDPipe } from "@nestjs/common";
import { Args, ID, Mutation, Query, Resolver } from "@nestjs/graphql";
import { Roles } from "../../common/auth";
import { ListArgs } from "../../common/pagination";
import { Role } from "../auth/models/role.enum";
import { DepartmentsService } from "./departments.service";
import { CreateDepartmentInput } from "./dto/create-department.input";
import { UpdateDepartmentInput } from "./dto/update-department.input";
import { Department } from "./models/department";
import { DepartmentPage } from "./models/department-page";

/** The department catalog is for admins only (PLAN.md §8); the guards enforce it for every operation. */
@Roles(Role.ADMIN)
@Resolver(() => Department)
export class DepartmentsResolver {
  constructor(private readonly service: DepartmentsService) {}

  @Query(() => DepartmentPage, { name: "departments" })
  list(@Args() args: ListArgs): Promise<DepartmentPage> {
    return this.service.list(args);
  }

  @Mutation(() => Department)
  createDepartment(@Args("input") input: CreateDepartmentInput): Promise<Department> {
    return this.service.create(input);
  }

  @Mutation(() => Department)
  updateDepartment(@Args("input") input: UpdateDepartmentInput): Promise<Department> {
    return this.service.update(input);
  }

  @Mutation(() => Boolean)
  async deleteDepartment(
    @Args("id", { type: () => ID }, ParseUUIDPipe) id: string,
  ): Promise<boolean> {
    await this.service.delete(id);
    return true;
  }
}
