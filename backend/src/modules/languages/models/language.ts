import { Field, ID, ObjectType } from "@nestjs/graphql";

@ObjectType()
export class Language {
  @Field(() => ID)
  id!: string;

  @Field()
  name!: string;

  /** ISO code, always uppercase (e.g. "EN", "PT-BR"). */
  @Field()
  iso!: string;

  @Field()
  nativeName!: string;
}
