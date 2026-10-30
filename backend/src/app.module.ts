import { ApolloDriver, ApolloDriverConfig } from "@nestjs/apollo";
import { Module } from "@nestjs/common";
import { GraphQLModule } from "@nestjs/graphql";
import { join } from "node:path";
import { ClockModule } from "./common/clock";
import { AppConfigModule } from "./config";
import { HealthModule } from "./modules/health/health.module";
import { PrismaModule } from "./prisma/prisma.module";

@Module({
  imports: [
    AppConfigModule,
    ClockModule,
    PrismaModule,
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      // The generated, committed contract (D3). Sorted so that diffs only show real changes.
      autoSchemaFile: join(process.cwd(), "schema.gql"),
      sortSchema: true,
    }),
    HealthModule,
  ],
})
export class AppModule {}
