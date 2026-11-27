import { ArgsType, Field, ID } from "@nestjs/graphql";
import { IsOptional, IsUUID } from "class-validator";
import { ListArgs } from "../../../common/pagination";

/** `cvs(search, sort, page, userId)`. `userId` narrows the list to one user; only admins may use it for another user. */
@ArgsType()
export class CvsArgs extends ListArgs {
  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  userId?: string;
}
