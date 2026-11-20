import { ModulesContainer } from "@nestjs/core";
import { GraphQLSchemaBuilderModule, GraphQLSchemaFactory } from "@nestjs/graphql";
import { Test } from "@nestjs/testing";
import { PrismaService } from "./prisma/prisma.service";

type ResolverClasses = Parameters<GraphQLSchemaFactory["create"]>[0];

// Metadata key that `@Resolver()` sets on a class (RESOLVER_TYPE_METADATA in @nestjs/graphql, not exported).
const RESOLVER_TYPE_METADATA = "graphql:resolver_type";

const testEnv = {
  DATABASE_URL: "postgresql://user:password@localhost:5432/test",
  JWT_ACCESS_SECRET: "unit-test-access-secret-0123456789abc",
  JWT_REFRESH_SECRET: "unit-test-refresh-secret-0123456789ab",
};

/**
 * The `@Field(() => Type)` arrows in the DTOs, models and resolvers only run when the schema is built.
 * The app builds it at start-up and writes schema.gql; this test builds it in memory, so it needs no
 * database and does not touch the committed file.
 */
describe("GraphQL schema", () => {
  const previousEnv = { ...process.env };

  afterAll(() => {
    // Put the variables back, so this file does not change the environment of other specs.
    for (const key of Object.keys(testEnv)) {
      const previous = previousEnv[key];
      if (previous === undefined) delete process.env[key];
      else process.env[key] = previous;
    }
  });

  it("builds from every resolver of the app", async () => {
    // Config validation runs when app.module is imported, so the variables must exist before that.
    Object.assign(process.env, testEnv);
    const { AppModule } = await import("./app.module.js");
    // `compile()` does not run `onModuleInit`, so the empty Prisma stub is never called.
    const appRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue({})
      .compile();
    // Resolvers are found by the `@Resolver()` decorator, not by the class name.
    const resolvers: ResolverClasses = [...appRef.get(ModulesContainer).values()]
      .flatMap((module) => [...module.providers.values()])
      .flatMap((provider) => (provider.metatype ? [provider.metatype] : []))
      .filter((metatype) => Reflect.hasMetadata(RESOLVER_TYPE_METADATA, metatype));
    const builderRef = await Test.createTestingModule({
      imports: [GraphQLSchemaBuilderModule],
    }).compile();

    const schema = await builderRef.get(GraphQLSchemaFactory).create(resolvers);

    expect(resolvers.length).toBeGreaterThan(0);
    expect(Object.keys(schema.getQueryType()?.getFields() ?? {})).toEqual(
      expect.arrayContaining(["me", "cvs", "projects", "cvPreview", "exportCvPdf"]),
    );
    expect(Object.keys(schema.getMutationType()?.getFields() ?? {})).toEqual(
      expect.arrayContaining(["signIn", "signUp", "createCv", "createProject"]),
    );
  });
});
