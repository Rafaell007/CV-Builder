import { Query, Resolver } from "@nestjs/graphql";
import { Public } from "../../common/auth";
import { Health } from "./health.model";
import { HealthService } from "./health.service";

@Resolver(() => Health)
export class HealthResolver {
  constructor(private readonly healthService: HealthService) {}

  // Public, so monitoring can call it without signing in.
  @Public()
  @Query(() => Health)
  health(): Health {
    return this.healthService.check();
  }
}
