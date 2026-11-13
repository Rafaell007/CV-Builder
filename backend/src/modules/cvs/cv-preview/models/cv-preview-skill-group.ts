import { Field, ObjectType } from "@nestjs/graphql";
import { CvPreviewSkill } from "./cv-preview-skill";

/** The skills of one category in the preview, for example Frontend. */
@ObjectType()
export class CvPreviewSkillGroup {
  /** The name of the skill category. */
  @Field()
  category!: string;

  @Field(() => [CvPreviewSkill])
  skills!: CvPreviewSkill[];
}
