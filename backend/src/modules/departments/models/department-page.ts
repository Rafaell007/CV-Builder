import { ObjectType } from "@nestjs/graphql";
import { Paginated } from "../../../common/pagination";
import { Department } from "./department";

@ObjectType()
export class DepartmentPage extends Paginated(Department) {}
