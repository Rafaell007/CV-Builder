import { expect, test, type APIRequestContext, type BrowserContext } from "@playwright/test";
import { createAccount, newEmail } from "../support/account";
import { findResetToken, findVerificationCode } from "../support/mailpit";
import { ADMIN_EMAIL, PASSWORD, signIn, USER_EMAIL } from "../support/signIn";
import { signUp } from "../support/signUp";

// The backend names the cause of a refused request in `extensions.reason`, and the frontend reads those strings
// (`readFailure`). The two sides write them separately, so this spec sends the real request for each reason and checks
// the string on the wire. The strings below are written out on purpose: they are the contract, not an import of
// frontend or backend code.
//
// Not covered, because no request can cause them without a race or a clock:
// - CONCURRENT_CHANGE: two admin writes must hit the same user row at the same moment.
// - CODE_EXPIRED and RESET_TOKEN_EXPIRED: the code and the link expire after minutes, and the backend runs a production build.
// - CODE_USED: only a parallel request finds a code that was just used; a later try finds the user verified.
// - START_OUTSIDE_PROJECT, END_OUTSIDE_PROJECT, END_BEFORE_START: they come in `fieldErrors[].reasons`, not `extensions.reason`.

type Refusal = { code: string | undefined; reason: string | undefined };
type GraphqlError = { extensions?: { code?: string; reason?: string } };

/** Sends one operation and returns the code and the reason of its first error. Fails when there is no error. */
async function refusalOf(
  request: APIRequestContext,
  query: string,
  variables: Record<string, unknown> = {},
): Promise<Refusal> {
  const response = await request.post("/graphql", { data: { query, variables } });
  const body = (await response.json()) as { errors?: GraphqlError[] };
  const error = body.errors?.[0];
  if (!error) throw new Error(`The backend did not refuse: ${JSON.stringify(body)}`);
  return { code: error.extensions?.code, reason: error.extensions?.reason };
}

const SIGN_UP = "mutation SignUp($input: SignUpInput!) { signUp(input: $input) { id } }";
const VERIFY_EMAIL =
  "mutation Verify($input: VerifyEmailInput!) { verifyEmail(input: $input) { id } }";
const RESEND_CODE = "mutation { resendVerificationCode }";
const FORGOT_PASSWORD =
  "mutation Forgot($input: ForgotPasswordInput!) { forgotPassword(input: $input) }";
const RESET_PASSWORD =
  "mutation Reset($input: ResetPasswordInput!) { resetPassword(input: $input) }";
const CHANGE_PASSWORD =
  "mutation Change($input: ChangePasswordInput!) { changePassword(input: $input) }";
const UPDATE_USER =
  "mutation Update($input: UpdateUserInput!) { updateUser(input: $input) { id } }";
const DELETE_USER = "mutation Delete($id: ID!) { deleteUser(id: $id) }";
const CREATE_CV = "mutation CreateCv($input: CreateCvInput!) { createCv(input: $input) { id } }";
const CREATE_LANGUAGE =
  "mutation CreateLanguage($input: CreateLanguageInput!) { createLanguage(input: $input) { id } }";
const ME = "query { me { id } }";

// A code of the right format that is never the real one.
const wrongCodeFor = (code: string) => (code === "000000" ? "111111" : "000000");

async function readCode(email: string): Promise<string> {
  await expect.poll(() => findVerificationCode(email), { timeout: 10_000 }).toBeTruthy();
  return (await findVerificationCode(email)) as string;
}

async function currentUserId(context: BrowserContext): Promise<string> {
  const response = await context.request.post("/graphql", { data: { query: ME } });
  const body = (await response.json()) as { data: { me: { id: string } } };
  return body.data.me.id;
}

test.describe("sign-up and verification", () => {
  test("a taken email gives CONFLICT with EMAIL_TAKEN", async ({ request }) => {
    const refusal = await refusalOf(request, SIGN_UP, {
      input: { email: USER_EMAIL, password: PASSWORD },
    });

    expect(refusal).toEqual({ code: "CONFLICT", reason: "EMAIL_TAKEN" });
  });

  test("a wrong code gives BAD_USER_INPUT with CODE_INVALID", async ({ context }) => {
    const email = await signUp(context);
    const wrong = wrongCodeFor(await readCode(email));

    const refusal = await refusalOf(context.request, VERIFY_EMAIL, { input: { code: wrong } });

    expect(refusal).toEqual({ code: "BAD_USER_INPUT", reason: "CODE_INVALID" });
  });

  test("the sixth wrong code gives TOO_MANY_REQUESTS with TOO_MANY_ATTEMPTS", async ({
    context,
  }) => {
    const email = await signUp(context);
    const wrong = wrongCodeFor(await readCode(email));
    // The backend allows 5 tries for one code (VERIFICATION_MAX_ATTEMPTS); each wrong one is CODE_INVALID.
    for (let attempt = 1; attempt <= 5; attempt += 1) {
      const refusal = await refusalOf(context.request, VERIFY_EMAIL, { input: { code: wrong } });
      expect(refusal.reason).toBe("CODE_INVALID");
    }

    const refusal = await refusalOf(context.request, VERIFY_EMAIL, { input: { code: wrong } });

    expect(refusal).toEqual({ code: "TOO_MANY_REQUESTS", reason: "TOO_MANY_ATTEMPTS" });
  });

  test("RESEND right after sign-up gives TOO_MANY_REQUESTS with RESEND_COOLDOWN", async ({
    context,
  }) => {
    await signUp(context);

    const refusal = await refusalOf(context.request, RESEND_CODE);

    expect(refusal).toEqual({ code: "TOO_MANY_REQUESTS", reason: "RESEND_COOLDOWN" });
  });

  test("RESEND by a verified user gives CONFLICT with ALREADY_VERIFIED", async ({ context }) => {
    await signIn(context, USER_EMAIL);

    const refusal = await refusalOf(context.request, RESEND_CODE);

    expect(refusal).toEqual({ code: "CONFLICT", reason: "ALREADY_VERIFIED" });
  });

  test("a verified-only action of an unverified user gives FORBIDDEN with EMAIL_NOT_VERIFIED", async ({
    context,
  }) => {
    await signUp(context);

    const refusal = await refusalOf(context.request, CREATE_CV, {
      input: { name: "Reason check", description: "x", education: "x" },
    });

    expect(refusal).toEqual({ code: "FORBIDDEN", reason: "EMAIL_NOT_VERIFIED" });
  });
});

test.describe("password", () => {
  test("an unknown reset token gives BAD_USER_INPUT with RESET_TOKEN_INVALID", async ({
    request,
  }) => {
    const refusal = await refusalOf(request, RESET_PASSWORD, {
      input: { token: "not-a-real-token", newPassword: "Password456!" },
    });

    expect(refusal).toEqual({ code: "BAD_USER_INPUT", reason: "RESET_TOKEN_INVALID" });
  });

  test("a reset token used twice gives BAD_USER_INPUT with RESET_TOKEN_USED", async ({
    request,
  }) => {
    const email = newEmail("reasons-reset");
    await createAccount(request, email, PASSWORD);
    await request.post("/graphql", {
      data: { query: FORGOT_PASSWORD, variables: { input: { email } } },
    });
    await expect.poll(() => findResetToken(email), { timeout: 10_000 }).toBeTruthy();
    const token = (await findResetToken(email)) as string;
    const input = { token, newPassword: "Password456!" };
    const first = await request.post("/graphql", {
      data: { query: RESET_PASSWORD, variables: { input } },
    });
    expect(((await first.json()) as { errors?: unknown }).errors).toBeUndefined();

    const refusal = await refusalOf(request, RESET_PASSWORD, { input });

    expect(refusal).toEqual({ code: "BAD_USER_INPUT", reason: "RESET_TOKEN_USED" });
  });

  test("a wrong current password gives BAD_USER_INPUT with CURRENT_PASSWORD_INCORRECT", async ({
    context,
  }) => {
    await signUp(context);

    const refusal = await refusalOf(context.request, CHANGE_PASSWORD, {
      input: { currentPassword: "Wrong1234!", newPassword: "Password456!" },
    });

    expect(refusal).toEqual({ code: "BAD_USER_INPUT", reason: "CURRENT_PASSWORD_INCORRECT" });
  });

  test("a new password equal to the current one gives BAD_USER_INPUT with NEW_PASSWORD_SAME", async ({
    context,
  }) => {
    await signUp(context);

    const refusal = await refusalOf(context.request, CHANGE_PASSWORD, {
      input: { currentPassword: PASSWORD, newPassword: PASSWORD },
    });

    expect(refusal).toEqual({ code: "BAD_USER_INPUT", reason: "NEW_PASSWORD_SAME" });
  });
});

test.describe("admin actions", () => {
  test("an admin who removes their own Admin role gets CONFLICT with OWN_ROLE", async ({
    context,
  }) => {
    await signIn(context, ADMIN_EMAIL);
    const id = await currentUserId(context);
    // The backend checks D24 before it looks up the department and the position, so any id works for them.
    const unknownId = "00000000-0000-4000-8000-000000000000";

    const refusal = await refusalOf(context.request, UPDATE_USER, {
      input: {
        id,
        firstName: "Ada",
        lastName: "Admin",
        departmentId: unknownId,
        positionId: unknownId,
        role: "USER",
      },
    });

    expect(refusal).toEqual({ code: "CONFLICT", reason: "OWN_ROLE" });
  });

  test("an admin who deletes themselves gets CONFLICT with SELF_DELETE", async ({ context }) => {
    await signIn(context, ADMIN_EMAIL);
    const id = await currentUserId(context);

    const refusal = await refusalOf(context.request, DELETE_USER, { id });

    expect(refusal).toEqual({ code: "CONFLICT", reason: "SELF_DELETE" });
  });

  test("a language with a taken ISO code gives CONFLICT with ISO_TAKEN", async ({ context }) => {
    await signIn(context, ADMIN_EMAIL);

    const refusal = await refusalOf(context.request, CREATE_LANGUAGE, {
      // EN is a seeded language (backend/prisma/seed/catalogs.data.ts); the name is new, so only the ISO code clashes.
      input: { iso: "EN", name: `Reasons ${Date.now()}`, nativeName: "Reasons" },
    });

    expect(refusal).toEqual({ code: "CONFLICT", reason: "ISO_TAKEN" });
  });
});
