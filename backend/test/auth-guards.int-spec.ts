import { ApolloDriver, ApolloDriverConfig } from "@nestjs/apollo";
import { INestApplication, Module } from "@nestjs/common";
import { GraphQLModule, Query, Resolver } from "@nestjs/graphql";
import { JwtService } from "@nestjs/jwt";
import { Test } from "@nestjs/testing";
import { ApiConventionsModule } from "../src/common/api-conventions";
import { CurrentUser, Public, Roles, Verified } from "../src/common/auth";
import type { AuthUser } from "../src/common/auth";
import { ClockModule } from "../src/common/clock";
import { AppConfigModule } from "../src/config";
import { Role } from "../src/generated/prisma/enums";
import { AuthModule } from "../src/modules/auth/auth.module";
import { PrismaModule } from "../src/prisma/prisma.module";
import { PrismaService } from "../src/prisma/prisma.service";
import { createUser, TEST_PASSWORD } from "./support/create-user";
import { graphqlRequest, toCookiePair } from "./support/graphql-request";

// Resolvers with one guard each. They live only in this test, so the committed schema.gql stays untouched.
@Resolver()
class GuardProbeResolver {
  @Query(() => String)
  signedInOnly(@CurrentUser() user: AuthUser | undefined): string {
    return user?.id ?? "";
  }

  @Roles(Role.ADMIN)
  @Query(() => String)
  adminOnly(): string {
    return "admin";
  }

  @Verified()
  @Query(() => String)
  verifiedOnly(): string {
    return "verified";
  }

  @Public()
  @Query(() => String)
  openToAll(): string {
    return "open";
  }
}

@Module({ providers: [GuardProbeResolver] })
class GuardProbeModule {}

const SIGN_IN = `mutation ($input: SignInInput!) { signIn(input: $input) { id } }`;

// The same modules, in the same order, as AppModule, with an in-memory schema.
async function createProbeApp(): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({
    imports: [
      AppConfigModule,
      ClockModule,
      PrismaModule,
      AuthModule,
      ApiConventionsModule,
      GraphQLModule.forRoot<ApolloDriverConfig>({
        driver: ApolloDriver,
        autoSchemaFile: true,
        context: ({ req, res }: { req: unknown; res: unknown }) => ({ req, res }),
      }),
      GuardProbeModule,
    ],
  }).compile();
  const app = moduleRef.createNestApplication();
  await app.init();
  return app;
}

describe("guards", () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createProbeApp();
    await createUser(app, { email: "admin@example.com", role: Role.ADMIN, isVerified: true });
    await createUser(app, { email: "verified@example.com", isVerified: true });
    await createUser(app, { email: "unverified@example.com", isVerified: false });
  });

  afterAll(async () => {
    await app.close();
  });

  async function cookiesOf(email: string): Promise<string[]> {
    const { setCookies } = await graphqlRequest(app, SIGN_IN, {
      variables: { input: { email, password: TEST_PASSWORD } },
    });
    return setCookies.map(toCookiePair);
  }

  async function errorOf(query: string, cookies: string[] = []) {
    const { body } = await graphqlRequest(app, query, { cookies });
    return body.errors?.[0]?.extensions;
  }

  describe("JwtAuthGuard", () => {
    it("lets a signed-in user reach a resolver without extra decorators", async () => {
      const { body } = await graphqlRequest(app, "{ signedInOnly }", {
        cookies: await cookiesOf("verified@example.com"),
      });

      expect(body.errors).toBeUndefined();
      expect(body.data?.["signedInOnly"]).toEqual(expect.any(String));
    });

    it("answers UNAUTHENTICATED without a session", async () => {
      expect(await errorOf("{ signedInOnly }")).toMatchObject({ code: "UNAUTHENTICATED" });
    });

    it("answers UNAUTHENTICATED for a token that is not valid", async () => {
      expect(await errorOf("{ signedInOnly }", ["access_token=garbage"])).toMatchObject({
        code: "UNAUTHENTICATED",
      });
    });

    it("answers UNAUTHENTICATED for an expired token", async () => {
      const user = await app.get(PrismaService).user.findUniqueOrThrow({
        where: { email: "verified@example.com" },
      });
      const expired = await new JwtService().signAsync(
        {},
        { subject: user.id, secret: process.env["JWT_ACCESS_SECRET"] ?? "", expiresIn: -10 },
      );

      expect(await errorOf("{ signedInOnly }", [`access_token=${expired}`])).toMatchObject({
        code: "UNAUTHENTICATED",
      });
    });

    it("answers UNAUTHENTICATED for a token signed with another secret", async () => {
      const user = await app.get(PrismaService).user.findUniqueOrThrow({
        where: { email: "verified@example.com" },
      });
      const forged = await new JwtService().signAsync(
        {},
        { subject: user.id, secret: "z".repeat(40), expiresIn: 60 },
      );

      expect(await errorOf("{ signedInOnly }", [`access_token=${forged}`])).toMatchObject({
        code: "UNAUTHENTICATED",
      });
    });

    it("answers UNAUTHENTICATED once the user was deleted", async () => {
      await createUser(app, { email: "leaving@example.com" });
      const cookies = await cookiesOf("leaving@example.com");
      await app.get(PrismaService).user.delete({ where: { email: "leaving@example.com" } });

      expect(await errorOf("{ signedInOnly }", cookies)).toMatchObject({ code: "UNAUTHENTICATED" });
    });

    it("lets @Public() resolvers through without a session", async () => {
      const { body } = await graphqlRequest(app, "{ openToAll }");

      expect(body).toEqual({ data: { openToAll: "open" } });
    });
  });

  describe("RolesGuard", () => {
    it("lets an admin reach an admin resolver", async () => {
      const { body } = await graphqlRequest(app, "{ adminOnly }", {
        cookies: await cookiesOf("admin@example.com"),
      });

      // This also proves that JwtAuthGuard runs first: RolesGuard needs request.user.
      expect(body).toEqual({ data: { adminOnly: "admin" } });
    });

    it("answers FORBIDDEN for a user without the role", async () => {
      expect(await errorOf("{ adminOnly }", await cookiesOf("verified@example.com"))).toMatchObject(
        {
          code: "FORBIDDEN",
        },
      );
    });

    it("answers UNAUTHENTICATED, not FORBIDDEN, without a session", async () => {
      expect(await errorOf("{ adminOnly }")).toMatchObject({ code: "UNAUTHENTICATED" });
    });

    it("uses the role stored now, not the role at sign-in", async () => {
      const cookies = await cookiesOf("verified@example.com");
      const prisma = app.get(PrismaService);
      await prisma.user.update({
        where: { email: "verified@example.com" },
        data: { role: Role.ADMIN },
      });

      try {
        const { body } = await graphqlRequest(app, "{ adminOnly }", { cookies });
        expect(body.errors).toBeUndefined();
      } finally {
        await prisma.user.update({
          where: { email: "verified@example.com" },
          data: { role: Role.USER },
        });
      }
    });
  });

  describe("VerifiedGuard", () => {
    it("lets a verified user reach a verified-only resolver", async () => {
      const { body } = await graphqlRequest(app, "{ verifiedOnly }", {
        cookies: await cookiesOf("verified@example.com"),
      });

      expect(body).toEqual({ data: { verifiedOnly: "verified" } });
    });

    it("answers FORBIDDEN with EMAIL_NOT_VERIFIED for an unverified user", async () => {
      expect(
        await errorOf("{ verifiedOnly }", await cookiesOf("unverified@example.com")),
      ).toMatchObject({ code: "FORBIDDEN", reason: "EMAIL_NOT_VERIFIED" });
    });

    it("lets an unverified user use resolvers that do not need verification", async () => {
      const { body } = await graphqlRequest(app, "{ signedInOnly }", {
        cookies: await cookiesOf("unverified@example.com"),
      });

      expect(body.errors).toBeUndefined();
    });

    it("answers UNAUTHENTICATED without a session", async () => {
      expect(await errorOf("{ verifiedOnly }")).toMatchObject({ code: "UNAUTHENTICATED" });
    });
  });
});
