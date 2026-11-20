import { ModulesContainer } from "@nestjs/core";
import { GraphQLSchemaBuilderModule, GraphQLSchemaFactory } from "@nestjs/graphql";
import { Test } from "@nestjs/testing";
import { PrismaService } from "./prisma/prisma.service";

type ResolverClasses = Parameters<GraphQLSchemaFactory["create"]>[0];

/**
 * The `@Field(() => Type)` arrows in the DTOs, models and resolvers only run when the schema is built.
 * The app builds it at start-up and writes schema.gql; this test builds it in memory, so it needs no
 * database and does not touch the committed file.
 */
describe("GraphQL schema", () => {
  it("builds from every resolver of the app", async () => {
    // Config validation runs when app.module is imported, so the variables must exist before that.
    process.env["DATABASE_URL"] = "postgresql://user:password@localhost:5432/test";
    process.env["JWT_ACCESS_SECRET"] = "unit-test-access-secret-0123456789abc";
    process.env["JWT_REFRESH_SECRET"] = "unit-test-refresh-secret-0123456789ab";
    const { AppModule } = await import("./app.module.js");
    const appRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue({})
      .compile();
    const resolvers: ResolverClasses = [...appRef.get(ModulesContainer).values()]
      .flatMap((module) => [...module.providers.values()])
      .flatMap((provider) => (provider.metatype ? [provider.metatype] : []))
      .filter((metatype) => metatype.name.endsWith("Resolver"));
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
