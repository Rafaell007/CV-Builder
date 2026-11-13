import { Field, ObjectType } from "@nestjs/graphql";

/**
 * A project in the preview. It joins the catalog data of the project with the dates, roles and
 * responsibilities of the person in this CV.
 */
@ObjectType()
export class CvPreviewProject {
  @Field()
  name!: string;

  @Field()
  description!: string;

  @Field()
  domain!: string;

  /** The names of the technologies used in the project. */
  @Field(() => [String])
  environment!: string[];

  /** The names of the roles of the person in the project. */
  @Field(() => [String])
  roles!: string[];

  /** The period as text for display, for example Jan 2023 - Present. */
  @Field()
  period!: string;

  @Field()
  startDate!: Date;

  /** Null means the person still works on the project (Present). */
  @Field(() => Date, { nullable: true })
  endDate!: Date | null;

  /** Null means no responsibilities were entered for the project. */
  @Field(() => String, { nullable: true })
  responsibilities!: string | null;
}
