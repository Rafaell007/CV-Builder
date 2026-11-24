import type { BrowserContext, Locator, Page } from "@playwright/test";
import { graphql } from "./graphql";
import { PASSWORD } from "./signIn";

/**
 * The first-name cell of the seeded admin, Ada Admin (backend/prisma/seed/users.data.ts), in the Employees table.
 * The list starts sorted by first name, A to Z, with empty names last, so Ada is on page 1. Seeing it proves the
 * whole chain: browser → Next.js → NestJS → seeded PostgreSQL.
 */
export function seededUserCell(page: Page): Locator {
  return page
    .getByRole("table", { name: "Employees list" })
    .getByRole("cell", { name: "Ada", exact: true })
    .first();
}

// The largest page the backend allows (backend/src/common/pagination/page.input.ts).
const MAX_PAGE_SIZE = 100;

const CREATE_USER =
  "mutation CreateUser($input: CreateUserInput!) { createUser(input: $input) { id } }";

export interface TestUser {
  firstName: string;
  lastName: string;
  /** The email is made from the names, so it is unique when the names are. */
  email?: string;
  /** A seeded department; seeded users work in it too, so the catalog specs never delete it. Default: Engineering. */
  department?: string;
  /** A seeded position. Default: Frontend Developer. */
  position?: string;
}

/** The email of a test user: lower case, without spaces, e.g. `alpha.e2eusers@example.com`. */
export function testUserEmail({ firstName, lastName }: Pick<TestUser, "firstName" | "lastName">) {
  return `${firstName}.${lastName}`.toLowerCase().replace(/\s+/g, "") + "@example.com";
}

/** The id of the seeded department or position with exactly this name. */
async function findCatalogId(
  context: BrowserContext,
  catalog: "departments" | "positions",
  name: string,
): Promise<string> {
  const data = await graphql<Record<string, { items: { id: string; name: string }[] }>>(
    context,
    `query Find($search: String, $page: PageInput!) { ${catalog}(search: $search, page: $page) { items { id name } } }`,
    { search: name, page: { number: 1, size: MAX_PAGE_SIZE } },
  );
  const item = data[catalog]!.items.find((candidate) => candidate.name === name);
  if (!item) throw new Error(`No ${catalog} item named ${name}`);
  return item.id;
}

/** Creates one user with the role Employee and the seed password. The context must hold an Admin session. Returns the id. */
export async function createUser(context: BrowserContext, user: TestUser): Promise<string> {
  const [departmentId, positionId] = await Promise.all([
    findCatalogId(context, "departments", user.department ?? "Engineering"),
    findCatalogId(context, "positions", user.position ?? "Frontend Developer"),
  ]);
  const data = await graphql<{ createUser: { id: string } }>(context, CREATE_USER, {
    input: {
      email: user.email ?? testUserEmail(user),
      password: PASSWORD,
      firstName: user.firstName,
      lastName: user.lastName,
      departmentId,
      positionId,
      role: "USER",
    },
  });
  return data.createUser.id;
}

/**
 * Deletes every user whose first name, last name or email contains `text` (up to one page of 100), also a user that
 * a test made through the page. Use it in `afterEach`, so a test that failed halfway leaves no user behind. The
 * context must hold an Admin session.
 */
export async function deleteUsersByName(context: BrowserContext, text: string): Promise<void> {
  const data = await graphql<{ users: { items: { id: string }[] } }>(
    context,
    "query Find($search: String, $page: PageInput!) { users(search: $search, page: $page) { items { id } } }",
    { search: text, page: { number: 1, size: MAX_PAGE_SIZE } },
  );
  for (const { id } of data.users.items) {
    await graphql(context, "mutation DeleteUser($id: ID!) { deleteUser(id: $id) }", { id });
  }
}
