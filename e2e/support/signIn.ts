import type { BrowserContext } from "@playwright/test";

// Seeded accounts (root README, "Seed data and test users").
export const ADMIN_EMAIL = "admin@example.com";
export const USER_EMAIL = "user1@example.com";
const PASSWORD = "Password123!";

/**
 * Signs in through the frontend's /graphql. The sign-in page comes with S3.4; until then the session
 * cookies are set by calling the mutation. The browser context keeps them like after a normal sign-in.
 */
export async function signIn(context: BrowserContext, email: string): Promise<void> {
  const response = await context.request.post("/graphql", {
    data: {
      query: "mutation SignIn($input: SignInInput!) { signIn(input: $input) { id } }",
      variables: { input: { email, password: PASSWORD } },
    },
  });
  const body = (await response.json()) as { errors?: { message: string }[] };
  if (body.errors) throw new Error(`Sign-in failed: ${body.errors[0]?.message}`);
}
