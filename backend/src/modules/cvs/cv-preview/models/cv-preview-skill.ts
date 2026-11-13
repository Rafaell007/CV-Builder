import { Field, Int, ObjectType } from "@nestjs/graphql";
import { Mastery } from "../../../skills/models/mastery.enum";

/**
 * A skill in the preview. `mastery` is the level in this CV. `experienceYears` and `lastUsedYear`
 * are calculated from the projects of the CV.
 */
@ObjectType()
export class CvPreviewSkill {
  @Field()
  name!: string;

  @Field(() => Mastery)
  mastery!: Mastery;

  /** Null when no project of the CV can be linked to the skill, so the years cannot be calculated. */
  @Field(() => Int, { nullable: true })
  experienceYears!: number | null;

  /** Null when no project of the CV can be linked to the skill. */
  @Field(() => Int, { nullable: true })
  lastUsedYear!: number | null;
}
