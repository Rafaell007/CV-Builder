import { Field, ID, InputType } from "@nestjs/graphql";
import { IsUUID } from "class-validator";
import { CreateLanguageInput } from "./create-language.input";

@InputType()
export class UpdateLanguageInput extends CreateLanguageInput {
  @Field(() => ID)
  @IsUUID()
  id!: string;
}
