import { ObjectType } from "@nestjs/graphql";
import { Paginated } from "../../../common/pagination";
import { Skill } from "./skill";

@ObjectType()
export class SkillPage extends Paginated(Skill) {}
