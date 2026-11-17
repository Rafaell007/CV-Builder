import { Field, InputType } from "@nestjs/graphql";
import { IsNotEmpty, IsString, MaxLength } from "class-validator";
import { NormalizeSpaces } from "../../../common/validation";

@InputType()
export class CreatePositionInput {
  @Field()
  @NormalizeSpaces()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;
}
