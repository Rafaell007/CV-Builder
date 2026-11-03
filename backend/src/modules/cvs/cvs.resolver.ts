import { ParseUUIDPipe, UnauthorizedException } from "@nestjs/common";
import { Args, ID, Mutation, Query, Resolver } from "@nestjs/graphql";
import { CurrentUser, Verified } from "../../common/auth";
import type { AuthUser } from "../../common/auth";
import { CvsService } from "./cvs.service";
import { CreateCvInput } from "./dto/create-cv.input";
import { CvsArgs } from "./dto/cvs.args";
import { UpdateCvInput } from "./dto/update-cv.input";
import { Cv } from "./models/cv";
import { CvPage } from "./models/cv-page";

/** Reading needs a session; creating, changing and deleting also need a verified email (D16). */
@Resolver(() => Cv)
export class CvsResolver {
  constructor(private readonly cvsService: CvsService) {}

  @Query(() => CvPage)
  cvs(@CurrentUser() user: AuthUser | undefined, @Args() args: CvsArgs): Promise<CvPage> {
    return this.cvsService.list(requireUser(user), args);
  }

  @Query(() => Cv)
  cv(
    @CurrentUser() user: AuthUser | undefined,
    @Args("id", { type: () => ID }, ParseUUIDPipe) id: string,
  ): Promise<Cv> {
    return this.cvsService.get(requireUser(user), id);
  }

  @Verified()
  @Mutation(() => Cv)
  createCv(
    @CurrentUser() user: AuthUser | undefined,
    @Args("input") input: CreateCvInput,
  ): Promise<Cv> {
    return this.cvsService.create(requireUser(user), input);
  }

  @Verified()
  @Mutation(() => Cv)
  updateCv(
    @CurrentUser() user: AuthUser | undefined,
    @Args("input") input: UpdateCvInput,
  ): Promise<Cv> {
    return this.cvsService.update(requireUser(user), input);
  }

  @Verified()
  @Mutation(() => Cv)
  deleteCv(
    @CurrentUser() user: AuthUser | undefined,
    @Args("id", { type: () => ID }, ParseUUIDPipe) id: string,
  ): Promise<Cv> {
    return this.cvsService.delete(requireUser(user), id);
  }
}

// The global guard has already refused anonymous calls; this keeps the type honest.
function requireUser(user: AuthUser | undefined): AuthUser {
  if (user === undefined) throw new UnauthorizedException("Sign in to continue");
  return user;
}
