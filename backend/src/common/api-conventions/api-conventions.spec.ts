import { ApolloDriver, ApolloDriverConfig } from "@nestjs/apollo";
import { INestApplication, Logger, NotFoundException } from "@nestjs/common";
import {
  Args,
  Field,
  GraphQLModule,
  InputType,
  Mutation,
  ObjectType,
  Query,
  Resolver,
} from "@nestjs/graphql";
import { Test } from "@nestjs/testing";
import { IsString, MinLength } from "class-validator";
import request from "supertest";
import { Role } from "../../generated/prisma/enums";
import { Roles, Verified } from "../auth";
import { ListArgs, Paginated, resolveSort, toSkipTake } from "../pagination";
import { ApiConventionsModule } from "./api-conventions.module";

// A sample module written the way PLAN.md §4 describes, to prove the conventions work together.
@ObjectType()
class Fruit {
  @Field()
  name!: string;
}

@ObjectType()
class FruitPage extends Paginated(Fruit) {}

@InputType()
class CreateFruitInput {
  @Field()
  @IsString()
  @MinLength(3)
  name!: string;
}

const FRUIT = ["apple", "banana", "cherry", "grape", "mango"].map((name) => ({ name }));

@Resolver()
class SampleResolver {
  @Query(() => FruitPage)
  fruits(@Args() args: ListArgs): FruitPage {
    const sort = resolveSort(args.sort, ["name"], { field: "name", direction: "asc" });
    const { skip, take } = toSkipTake(args.page);
    const matching = FRUIT.filter(({ name }) => name.includes(args.search ?? "")).sort(
      (a, b) => a.name.localeCompare(b.name) * (sort.direction === "asc" ? 1 : -1),
    );
    return { items: matching.slice(skip, skip + take), total: matching.length };
  }

  @Mutation(() => Fruit)
  createFruit(@Args("input") input: CreateFruitInput): Fruit {
    return { name: input.name };
  }

  @Query(() => Fruit)
  missingFruit(): Fruit {
    throw new NotFoundException("No such fruit");
  }

  @Query(() => Fruit)
  brokenFruit(): Fruit {
    throw new Error("password=hunter2 at db.internal");
  }

  @Roles(Role.ADMIN)
  @Query(() => String)
  adminOnly(): string {
    return "secret";
  }

  @Verified()
  @Query(() => String)
  verifiedOnly(): string {
    return "ok";
  }
}

describe("API conventions in a sample module", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ApiConventionsModule,
        GraphQLModule.forRoot<ApolloDriverConfig>({
          driver: ApolloDriver,
          autoSchemaFile: true,
          // Stands in for the auth guard: `x-test-user: ROLE:verified|unverified` signs a user in.
          context: ({ req }: { req: { headers: Record<string, string | undefined> } }) => {
            const [role, state] = (req.headers["x-test-user"] ?? "").split(":");
            return role
              ? { req: { user: { id: "1", role, isVerified: state === "verified" } } }
              : { req };
          },
        }),
      ],
      providers: [SampleResolver],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  async function run(query: string, user?: string): Promise<request.Response> {
    const call = request(app.getHttpServer()).post("/graphql");
    return (user ? call.set("x-test-user", user) : call).send({ query });
  }

  describe("pagination", () => {
    it("returns the first page with the total when no arguments are given", async () => {
      const { body } = await run("{ fruits { items { name } total } }");

      expect(body.data.fruits.total).toBe(5);
      expect(body.data.fruits.items).toHaveLength(5);
    });

    it("returns the requested page, sorted", async () => {
      const { body } = await run(
        `{ fruits(page: { number: 2, size: 2 }, sort: { field: "name", direction: DESC }) { items { name } total } }`,
      );

      expect(body.data.fruits).toEqual({
        items: [{ name: "cherry" }, { name: "banana" }],
        total: 5,
      });
    });

    it("filters by search and reports the filtered total", async () => {
      const { body } = await run(`{ fruits(search: "an") { items { name } total } }`);

      expect(body.data.fruits).toEqual({
        items: [{ name: "banana" }, { name: "mango" }],
        total: 2,
      });
    });
  });

  describe("validation", () => {
    it("returns field errors in BAD_USER_INPUT for an invalid page", async () => {
      const { body } = await run("{ fruits(page: { number: 1, size: 500 }) { total } }");

      expect(body.errors[0].extensions).toEqual({
        code: "BAD_USER_INPUT",
        fieldErrors: [{ field: "page.size", messages: ["size must not be greater than 100"] }],
      });
    });

    it("returns field errors for an invalid mutation input", async () => {
      const { body } = await run(`mutation { createFruit(input: { name: "ab" }) { name } }`);

      expect(body.errors[0].extensions).toEqual({
        code: "BAD_USER_INPUT",
        fieldErrors: [
          { field: "name", messages: ["name must be longer than or equal to 3 characters"] },
        ],
      });
    });

    it("rejects a sort field the module does not allow", async () => {
      const { body } = await run(`{ fruits(sort: { field: "color" }) { total } }`);

      expect(body.errors[0].extensions.code).toBe("BAD_USER_INPUT");
      expect(body.errors[0].extensions.fieldErrors[0].field).toBe("sort.field");
    });
  });

  describe("errors", () => {
    it("maps NotFoundException to NOT_FOUND", async () => {
      const { body } = await run("{ missingFruit { name } }");

      expect(body.errors[0]).toMatchObject({
        message: "No such fruit",
        extensions: { code: "NOT_FOUND" },
      });
    });

    it("hides the details of an unexpected error", async () => {
      jest.spyOn(Logger.prototype, "error").mockImplementation();

      const { body } = await run("{ brokenFruit { name } }");

      expect(body.errors[0].message).toBe("Internal server error");
      expect(body.errors[0].extensions.code).toBe("INTERNAL_SERVER_ERROR");
      expect(JSON.stringify(body)).not.toContain("hunter2");
      jest.restoreAllMocks();
    });
  });

  describe("guards", () => {
    it("answers UNAUTHENTICATED to @Roles when nobody is signed in", async () => {
      const { body } = await run("{ adminOnly }");

      expect(body.errors[0].extensions.code).toBe("UNAUTHENTICATED");
    });

    it("answers FORBIDDEN to @Roles for another role, and lets the allowed role in", async () => {
      const denied = await run("{ adminOnly }", "USER:verified");
      const allowed = await run("{ adminOnly }", "ADMIN:verified");

      expect(denied.body.errors[0].extensions.code).toBe("FORBIDDEN");
      expect(allowed.body.data.adminOnly).toBe("secret");
    });

    it("answers FORBIDDEN with reason EMAIL_NOT_VERIFIED to @Verified for an unverified user", async () => {
      const { body } = await run("{ verifiedOnly }", "USER:unverified");

      expect(body.errors[0].extensions).toEqual({
        code: "FORBIDDEN",
        reason: "EMAIL_NOT_VERIFIED",
      });
    });
  });
});
