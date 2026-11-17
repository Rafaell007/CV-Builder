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

/** The position catalog is for admins only (PLAN.md §8); the guards enforce it for every operation. */
@Roles(Role.ADMIN)
@Resolver(() => Position)
export class PositionsResolver {
  constructor(private readonly service: PositionsService) {}

  @Query(() => PositionPage, { name: "positions" })
  list(@Args() args: ListArgs): Promise<PositionPage> {
    return this.service.list(args);
  }

  @Mutation(() => Position)
  createPosition(@Args("input") input: CreatePositionInput): Promise<Position> {
    return this.service.create(input);
  }

  @Mutation(() => Position)
  updatePosition(@Args("input") input: UpdatePositionInput): Promise<Position> {
    return this.service.update(input);
  }

  @Mutation(() => Boolean)
  async deletePosition(
    @Args("id", { type: () => ID }, ParseUUIDPipe) id: string,
  ): Promise<boolean> {
    await this.service.delete(id);
    return true;
  }
}
