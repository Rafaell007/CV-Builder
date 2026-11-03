import { ArgsType, Field, ID } from "@nestjs/graphql";
import { Type } from "class-transformer";
import { IsOptional, IsUUID, ValidateNested } from "class-validator";
import { ListArgs, PageInput } from "../../../common/pagination";

/** The page size of the CVs table (D19). Other lists keep the shared default. */
export const CVS_PAGE_SIZE = 10;

const defaultPage = (): PageInput => Object.assign(new PageInput(), { size: CVS_PAGE_SIZE });

/** `cvs(search, sort, page, userId)`. `userId` narrows the list to one user; only admins may use it for another user. */
@ArgsType()
export class CvsArgs extends ListArgs {
  /** Same as in `ListArgs`, but a page without a size has 10 items (D19). */
  @Field(() => PageInput, { defaultValue: defaultPage() })
  @ValidateNested()
  @Type(() => PageInput)
  override page: PageInput = defaultPage();

  @Field(() => ID, { nullable: true })
  @IsOptional()
  @IsUUID()
  userId?: string;
}
