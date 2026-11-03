import type { APIRequestContext } from "@playwright/test";

type GraphQLBody = { errors?: { message: string }[] };

async function post(
  request: APIRequestContext,
  query: string,
  input: object,
): Promise<GraphQLBody> {
  const response = await request.post("/graphql", { data: { query, variables: { input } } });
  return (await response.json()) as GraphQLBody;
}

// A new email per call: the database is seeded at the start of a run, but a spec can run twice against it (retries).
export function newEmail(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`;
}

/**
 * Creates an account through the API. Pass the `request` fixture, not the page's context:
 * the sign-up answer sets session cookies, and the page under test must stay signed out.
 */
export async function createAccount(
  request: APIRequestContext,
  email: string,
  password: string,
): Promise<void> {
  const body = await post(
    request,
    "mutation SignUp($input: SignUpInput!) { signUp(input: $input) { id } }",
    { email, password },
  );
  if (body.errors) throw new Error(`Sign-up failed: ${body.errors[0]?.message}`);
}

// True when the backend accepts the email and password. Use the `request` fixture, like createAccount.
export async function canSignIn(
  request: APIRequestContext,
  email: string,
  password: string,
): Promise<boolean> {
  const body = await post(
    request,
    "mutation SignIn($input: SignInInput!) { signIn(input: $input) { id } }",
    { email, password },
  );
  return body.errors === undefined;
}
