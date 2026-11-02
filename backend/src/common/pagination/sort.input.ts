import { Field, InputType, registerEnumType } from "@nestjs/graphql";
import { IsEnum, IsNotEmpty, IsString, MaxLength } from "class-validator";

export enum SortDirection {
  ASC = "ASC",
  DESC = "DESC",
}

registerEnumType(SortDirection, { name: "SortDirection" });

/** Sort order of a list. Each module accepts only its own fields, see `resolveSort`. */
@InputType()
export class SortInput {
  @Field()
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  field!: string;

  @Field(() => SortDirection, { defaultValue: SortDirection.ASC })
  @IsEnum(SortDirection)
  direction: SortDirection = SortDirection.ASC;
}
