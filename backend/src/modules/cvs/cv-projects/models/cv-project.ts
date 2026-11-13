import { Field, ID, ObjectType } from "@nestjs/graphql";
import { Project } from "../../../projects/models/project";
import { ProjectRole } from "../../../projects/project-roles/models/project-role";

/**
 * A project in one CV (CV projects page). The catalog data (name, domain, description,
 * environment, project dates) is in `project`. The person's own dates, roles and responsibilities
 * belong to this entry. An empty `endDate` means "Present".
 */
@ObjectType()
export class CvProject {
  @Field(() => ID)
  id!: string;

  @Field(() => ID)
  cvId!: string;

  @Field(() => Project)
  project!: Project;

  @Field(() => [ProjectRole])
  roles!: ProjectRole[];

  @Field()
  startDate!: Date;

  @Field(() => Date, { nullable: true })
  endDate!: Date | null;

  @Field(() => String, { nullable: true })
  responsibilities!: string | null;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;
}
