# Backend

NestJS 11 API with GraphQL (code-first), Prisma 7 and PostgreSQL 17.
Commands are in the root [AGENTS.md](../AGENTS.md). The plan is in [PLAN.md](../PLAN.md).

## How to write a module

A module is one folder in `src/modules/<module>/`. The shape is in [PLAN.md §4](../PLAN.md#4-project-structure).

```
modules/skills/
  skills.module.ts
  skills.resolver.ts       thin: call the service, return the result
  skills.service.ts        business rules, ownership checks, Prisma calls
  dto/                     @InputType classes with class-validator rules
  models/                  @ObjectType classes
  skills.service.spec.ts · skills.resolver.spec.ts
```

The API conventions apply to every resolver without extra setup. `ApiConventionsModule` registers them.

### 1. Make a list query

A list query takes `ListArgs` (`search`, `sort`, `page`) and returns `{ items, total }`.

```ts
// models/skill-page.ts
@ObjectType()
export class SkillPage extends Paginated(Skill) {}

// skills.resolver.ts
@Query(() => SkillPage)
skills(@Args() args: ListArgs): Promise<SkillPage> {
  return this.skillsService.list(args);
}

// skills.service.ts
const SORT_FIELDS = ["name", "createdAt"] as const;

async list({ search, sort, page }: ListArgs): Promise<SkillPage> {
  const { field, direction } = resolveSort(sort, SORT_FIELDS, { field: "name", direction: "asc" });
  const where = search ? { name: { contains: search, mode: "insensitive" as const } } : {};
  const [items, total] = await this.prisma.$transaction([
    this.prisma.skill.findMany({ where, orderBy: { [field]: direction }, ...toSkipTake(page) }),
    this.prisma.skill.count({ where }),
  ]);
  return { items, total };
}
```

- `resolveSort` accepts only the fields that you list. It rejects all others with a field error.
- The page size is 20 by default. The maximum is 100.

### 2. Validate input

Put class-validator rules on the `@InputType` class. The global `ValidationPipe` checks every input.

```ts
@InputType()
export class CreateSkillInput {
  @Field()
  @IsString()
  @MinLength(2)
  name!: string;
}
```

Invalid input returns `BAD_USER_INPUT` with one entry per field:

```json
{ "extensions": { "code": "BAD_USER_INPUT",
  "fieldErrors": [{ "field": "name", "messages": ["name must be longer than or equal to 2 characters"] }] } }
```

For a rule that only the service can check, throw `ValidationFailedException` with the same shape.

### 3. Throw errors

Throw Nest exceptions in the service. The global exception filter maps them (D7):

| Throw | `extensions.code` |
|---|---|
| `ValidationFailedException` | `BAD_USER_INPUT` (with `fieldErrors`) |
| `UnauthorizedException` | `UNAUTHENTICATED` |
| `ForbiddenException` | `FORBIDDEN` |
| `NotFoundException`, Prisma `P2025` (record not found) | `NOT_FOUND` |
| `ConflictException`, Prisma `P2002` (unique constraint) | `CONFLICT` |
| `HttpException` with status 429 (thrown by `GqlThrottlerGuard`) | `TOO_MANY_REQUESTS` |
| any other error | `INTERNAL_SERVER_ERROR` (logged, no details sent to the client) |

### 4. Protect a resolver

Authorization is on the backend (D10). Add decorators to the resolver:

- `@Public()` — no sign-in needed.
- `@Roles(Role.ADMIN)` — only these roles. Other users get `FORBIDDEN`.
- `@Verified()` — only users with a verified email (D16). Others get `FORBIDDEN` with `reason: "EMAIL_NOT_VERIFIED"`.
- `@CurrentUser()` — the signed-in user as a parameter.

Ownership checks (a user can edit only own data) go into the service. Use `@CurrentUser()` to pass the user in.

The global `JwtAuthGuard` makes every resolver require a signed-in user. It sets `request.user` from the `access_token` cookie. A resolver that anonymous callers may use needs `@Public()`. A request without a valid session gets `UNAUTHENTICATED`. See [modules/auth](src/modules/auth/README.md).

To try it by hand, sign in with a seed user (`user1@example.com`, password `Password123!`) and keep the cookies:

```
curl -c cookies.txt -H 'Content-Type: application/json' http://localhost:4000/graphql \
  -d '{"query":"mutation { signIn(input: {email: \"user1@example.com\", password: \"Password123!\"}) { id role } }"}'
curl -b cookies.txt -H 'Content-Type: application/json' http://localhost:4000/graphql \
  -d '{"query":"{ me { email role } }"}'
```

### 5. Write the tests

- Service tests use a mocked `PrismaService`. Put them next to the service as `*.spec.ts`.
- `src/common/api-conventions/api-conventions.spec.ts` is a full example of a sample module with real HTTP requests.
