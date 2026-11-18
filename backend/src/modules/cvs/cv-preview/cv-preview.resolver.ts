import { Args, Query, Resolver } from "@nestjs/graphql";
import { CurrentUser } from "../../../common/auth";
import type { AuthUser } from "../../../common/auth";
import { requireUser } from "../../../common/auth";
import { CvPreviewService } from "./cv-preview.service";
import { CvPreviewArgs } from "./dto/cv-preview.args";
import { CvPreview } from "./models/cv-preview";

/** Reading needs a session only, like the other CV reads (no @Verified, no writes). */
@Resolver(() => CvPreview)
export class CvPreviewResolver {
  constructor(private readonly service: CvPreviewService) {}

  @Query(() => CvPreview)
  cvPreview(
    @CurrentUser() user: AuthUser | undefined,
    @Args() { cvId }: CvPreviewArgs,
  ): Promise<CvPreview> {
    return this.service.get(requireUser(user), cvId);
  }
}
