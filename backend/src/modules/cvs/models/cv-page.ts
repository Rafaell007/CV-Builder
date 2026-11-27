import { ObjectType } from "@nestjs/graphql";
import { Paginated } from "../../../common/pagination";
import { Cv } from "./cv";

@ObjectType()
export class CvPage extends Paginated(Cv) {}
