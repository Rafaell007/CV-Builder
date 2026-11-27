import { Field, InputType } from "@nestjs/graphql";
import { IsNotEmpty, IsString, MaxLength } from "class-validator";
import { NormalizeSpaces } from "../../../common/validation";

@InputType()
export class CreateDepartmentInput {
  @Field()
  @NormalizeSpaces()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;
}
