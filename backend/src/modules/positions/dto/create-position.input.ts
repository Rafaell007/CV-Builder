import { Field, InputType } from "@nestjs/graphql";
import { IsNotEmpty, IsString, MaxLength } from "class-validator";
import { Trim } from "../../../common/validation";

@InputType()
export class CreatePositionInput {
  @Field()
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;
}
