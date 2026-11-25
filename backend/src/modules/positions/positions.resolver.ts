import { ParseUUIDPipe } from "@nestjs/common";
import { Args, ID, Mutation, Query, Resolver } from "@nestjs/graphql";
import { Roles } from "../../common/auth";
import { ListArgs } from "../../common/pagination";
import { Role } from "../auth/models/role.enum";
import { PositionsService } from "./positions.service";
import { CreatePositionInput } from "./dto/create-position.input";
import { UpdatePositionInput } from "./dto/update-position.input";
import { Position } from "./models/position";
import { PositionPage } from "./models/position-page";

/**
 * The position catalog is managed by admins only (PLAN.md §8), so every operation has `@Roles(Role.ADMIN)`, except
 * `positionOptions`: a user picks their own position in the profile form, so it is for every signed-in user.
 */
@Resolver(() => Position)
export class PositionsResolver {
  constructor(private readonly service: PositionsService) {}

  @Roles(Role.ADMIN)
  @Query(() => PositionPage, { name: "positions" })
  list(@Args() args: ListArgs): Promise<PositionPage> {
    return this.service.list(args);
  }

  /** Every position, by name, for the Position select. Open to every signed-in user. */
  @Query(() => [Position], { name: "positionOptions" })
  listOptions(): Promise<Position[]> {
    return this.service.listOptions();
  }

  @Roles(Role.ADMIN)
  @Mutation(() => Position)
  createPosition(@Args("input") input: CreatePositionInput): Promise<Position> {
    return this.service.create(input);
  }

  @Roles(Role.ADMIN)
  @Mutation(() => Position)
  updatePosition(@Args("input") input: UpdatePositionInput): Promise<Position> {
    return this.service.update(input);
  }

  @Roles(Role.ADMIN)
  @Mutation(() => Boolean)
  async deletePosition(
    @Args("id", { type: () => ID }, ParseUUIDPipe) id: string,
  ): Promise<boolean> {
    await this.service.delete(id);
    return true;
  }
}
