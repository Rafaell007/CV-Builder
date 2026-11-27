import { ParseUUIDPipe } from "@nestjs/common";
import { Args, ID, Mutation, Query, Resolver } from "@nestjs/graphql";
import { Roles } from "../../common/auth";
import { ListArgs } from "../../common/pagination";
import { Role } from "../auth/models/role.enum";
import { LanguagesService } from "./languages.service";
import { CreateLanguageInput } from "./dto/create-language.input";
import { UpdateLanguageInput } from "./dto/update-language.input";
import { Language } from "./models/language";
import { LanguagePage } from "./models/language-page";

/** The language catalog is for admins only (PLAN.md §8); the guards enforce it for every operation. */
@Roles(Role.ADMIN)
@Resolver(() => Language)
export class LanguagesResolver {
  constructor(private readonly service: LanguagesService) {}

  @Query(() => LanguagePage, { name: "languages" })
  list(@Args() args: ListArgs): Promise<LanguagePage> {
    return this.service.list(args);
  }

  @Mutation(() => Language)
  createLanguage(@Args("input") input: CreateLanguageInput): Promise<Language> {
    return this.service.create(input);
  }

  @Mutation(() => Language)
  updateLanguage(@Args("input") input: UpdateLanguageInput): Promise<Language> {
    return this.service.update(input);
  }

  @Mutation(() => Boolean)
  async deleteLanguage(
    @Args("id", { type: () => ID }, ParseUUIDPipe) id: string,
  ): Promise<boolean> {
    await this.service.delete(id);
    return true;
  }
}
