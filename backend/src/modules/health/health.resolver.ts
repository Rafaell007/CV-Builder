import { Query, Resolver } from "@nestjs/graphql";
import { Health } from "./health.model";
import { HealthService } from "./health.service";

@Resolver(() => Health)
export class HealthResolver {
  constructor(private readonly healthService: HealthService) {}

  @Query(() => Health)
  health(): Health {
    return this.healthService.check();
  }
}
