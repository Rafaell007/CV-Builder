import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ThrottlerModule } from "@nestjs/throttler";
import type { Environment } from "../../config";

/**
 * One limit for every throttled operation: `THROTTLE_LIMIT` calls per `THROTTLE_TTL_SECONDS` from one
 * client IP. Each operation counts on its own. A module that uses `GqlThrottlerGuard` imports this module.
 */
@Module({
  imports: [
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<Environment, true>) => [
        {
          limit: config.get("THROTTLE_LIMIT", { infer: true }),
          ttl: config.get("THROTTLE_TTL_SECONDS", { infer: true }) * 1000, // the throttler counts in ms
        },
      ],
    }),
  ],
  exports: [ThrottlerModule],
})
export class ThrottlingModule {}
