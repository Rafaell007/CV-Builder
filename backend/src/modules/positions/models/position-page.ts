import { ObjectType } from "@nestjs/graphql";
import { Paginated } from "../../../common/pagination";
import { Position } from "./position";

@ObjectType()
export class PositionPage extends Paginated(Position) {}
