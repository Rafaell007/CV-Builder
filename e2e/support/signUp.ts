import type { BrowserContext } from "@playwright/test";
import { newEmail } from "./account";

const PASSWORD = "Password123!";

/**
 * Creates an unverified account through the frontend's /graphql and keeps the session cookies, like
 * after a normal sign-up. Seeded users are all verified (D16), so this is the way to get a user who
 * still has to enter a code. The sign-up page itself is covered by sign-up/sign-up.spec.ts.
 */
export async function signUp(context: BrowserContext): Promise<string> {
  const email = newEmail("verify");
  const response = await context.request.post("/graphql", {
    data: {
      query: "mutation SignUp($input: SignUpInput!) { signUp(input: $input) { id } }",
      variables: { input: { email, password: PASSWORD } },
    },
  });
  const body = (await response.json()) as { errors?: { message: string }[] };
  if (body.errors) throw new Error(`Sign-up failed: ${body.errors[0]?.message}`);
  return email;
}
