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

/**
 * The department catalog is managed by admins only (PLAN.md §8), so every operation has `@Roles(Role.ADMIN)`, except
 * `departmentOptions`: a user picks their own department in the profile form, so it is for every signed-in user.
 */
@Resolver(() => Department)
export class DepartmentsResolver {
  constructor(private readonly service: DepartmentsService) {}

  @Roles(Role.ADMIN)
  @Query(() => DepartmentPage, { name: "departments" })
  list(@Args() args: ListArgs): Promise<DepartmentPage> {
    return this.service.list(args);
  }

  /** Every department, by name, for the Department select. Open to every signed-in user. */
  @Query(() => [Department], { name: "departmentOptions" })
  listOptions(): Promise<Department[]> {
    return this.service.listOptions();
  }

  @Roles(Role.ADMIN)
  @Mutation(() => Department)
  createDepartment(@Args("input") input: CreateDepartmentInput): Promise<Department> {
    return this.service.create(input);
  }

  @Roles(Role.ADMIN)
  @Mutation(() => Department)
  updateDepartment(@Args("input") input: UpdateDepartmentInput): Promise<Department> {
    return this.service.update(input);
  }

  @Roles(Role.ADMIN)
  @Mutation(() => Boolean)
  async deleteDepartment(
    @Args("id", { type: () => ID }, ParseUUIDPipe) id: string,
  ): Promise<boolean> {
    await this.service.delete(id);
    return true;
  }
}
