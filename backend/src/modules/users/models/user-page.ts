import { ObjectType } from "@nestjs/graphql";
import { Paginated } from "../../../common/pagination";
import { User } from "./user";

@ObjectType()
export class UserPage extends Paginated(User) {}
