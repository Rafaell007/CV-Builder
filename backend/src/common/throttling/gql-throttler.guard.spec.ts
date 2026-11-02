import { HttpException, HttpStatus } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ThrottlerStorageService } from "@nestjs/throttler";
import type { ExecutionContext } from "@nestjs/common";
import { GqlThrottlerGuard } from "./gql-throttler.guard";

// GraphQL operations have no HTTP request of their own; the guard must read it from the GraphQL context.
const req = { ip: "10.0.0.1" };
const res = { header: jest.fn() };
const context = {
  getType: () => "graphql",
  getClass: () => class Resolver {},
  getHandler: () => function signIn() {},
  getArgs: () => [{}, {}, { req, res }, {}],
  getArgByIndex: (index: number) => [{}, {}, { req, res }, {}][index],
} as unknown as ExecutionContext;

async function createGuard(limit: number): Promise<GqlThrottlerGuard> {
  const guard = new GqlThrottlerGuard(
    { throttlers: [{ limit, ttl: 60_000 }] },
    new ThrottlerStorageService(),
    new Reflector(),
  );
  await guard.onModuleInit();
  return guard;
}

describe("GqlThrottlerGuard", () => {
  it("allows calls up to the limit, counted per client IP", async () => {
    const guard = await createGuard(2);

    await expect(guard.canActivate(context)).resolves.toBe(true);
    await expect(guard.canActivate(context)).resolves.toBe(true);
  });

  it("answers 429 with a plain message when the limit is passed", async () => {
    const guard = await createGuard(1);
    await guard.canActivate(context);

    const error: unknown = await guard.canActivate(context).catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(HttpException);
    expect((error as HttpException).getStatus()).toBe(HttpStatus.TOO_MANY_REQUESTS);
    expect((error as HttpException).message).toBe("Too many attempts, try again later");
  });
});
