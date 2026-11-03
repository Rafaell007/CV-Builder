import { ObjectType } from "@nestjs/graphql";
import { Paginated } from "../../../common/pagination";
import { Project } from "./project";

@ObjectType()
export class ProjectPage extends Paginated(Project) {}
