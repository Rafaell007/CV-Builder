import { ApolloDriver, ApolloDriverConfig } from "@nestjs/apollo";
import { Module } from "@nestjs/common";
import { GraphQLModule } from "@nestjs/graphql";
import { join } from "node:path";
import { ApiConventionsModule } from "./common/api-conventions";
import { ClockModule } from "./common/clock";
import { AppConfigModule } from "./config";
import { AuthModule } from "./modules/auth/auth.module";
import { HealthModule } from "./modules/health/health.module";
import { ProjectsModule } from "./modules/projects/projects.module";
import { PrismaModule } from "./prisma/prisma.module";

@Module({
  imports: [
    AppConfigModule,
    ClockModule,
    PrismaModule,
    // Before ApiConventionsModule: the sign-in guard must run before the role and verified guards.
    AuthModule,
    ApiConventionsModule,
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      // The generated, committed contract (D3). Sorted so that diffs only show real changes.
      autoSchemaFile: join(process.cwd(), "schema.gql"),
      sortSchema: true,
      // Guards and @CurrentUser() read `request.user`, which the auth guard sets (D10).
      // `res` lets the auth resolvers set and clear the session cookies (D9).
      context: ({ req, res }: { req: unknown; res: unknown }) => ({ req, res }),
    }),
    HealthModule,
    ProjectsModule,
  ],
})
export class AppModule {}
