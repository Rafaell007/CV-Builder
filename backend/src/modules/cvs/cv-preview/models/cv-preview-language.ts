import { Field, ObjectType } from "@nestjs/graphql";
import { Proficiency } from "./proficiency.enum";

/** A language of the CV owner with the level of the owner, shown in the Languages block of the preview. */
@ObjectType()
export class CvPreviewLanguage {
  @Field()
  name!: string;

  @Field(() => Proficiency)
  proficiency!: Proficiency;
}
