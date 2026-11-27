import { Field, ID, ObjectType } from "@nestjs/graphql";
import { CvPreviewLanguage } from "./cv-preview-language";
import { CvPreviewProject } from "./cv-preview-project";
import { CvPreviewSkillGroup } from "./cv-preview-skill-group";

/**
 * Everything the CV preview page needs, in one object. The service builds it from the CV, the
 * profile of the owner, the CV skills and the CV projects.
 */
@ObjectType()
export class CvPreview {
  @Field(() => ID)
  cvId!: string;

  @Field()
  name!: string;

  @Field()
  education!: string;

  @Field()
  description!: string;

  /** Null when the owner has no profile name yet. */
  @Field(() => String, { nullable: true })
  fullName!: string | null;

  /** Null when the owner has no position assigned. */
  @Field(() => String, { nullable: true })
  position!: string | null;

  @Field(() => [CvPreviewLanguage])
  languages!: CvPreviewLanguage[];

  /** The domains of the projects in the CV, without repeats. */
  @Field(() => [String])
  domains!: string[];

  @Field(() => [CvPreviewSkillGroup])
  skillGroups!: CvPreviewSkillGroup[];

  @Field(() => [CvPreviewProject])
  projects!: CvPreviewProject[];
}
