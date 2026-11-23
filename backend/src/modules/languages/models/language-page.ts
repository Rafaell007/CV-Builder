import { ObjectType } from "@nestjs/graphql";
import { Paginated } from "../../../common/pagination";
import { Language } from "./language";

@ObjectType()
export class LanguagePage extends Paginated(Language) {}
