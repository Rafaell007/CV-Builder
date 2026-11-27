import { expect, test, type Page } from "@playwright/test";
import { waitForHydration } from "../support/hydration";
import { ADMIN_EMAIL, signIn } from "../support/signIn";
import { createUser, deleteUsersByName, testUserEmail, type TestUser } from "../support/users";

// The avatar on the Profile tab of User Details (KAN-106). The tests make their own employees with this last name, so
// `afterEach` can remove them; their avatars go with them (the database deletes an avatar with its user). One word,
// not part of another spec's prefix.
const PREFIX = "E2EAvatar";

const alpha: TestUser = { firstName: "Alpha", lastName: PREFIX };
const beta: TestUser = { firstName: "Beta", lastName: PREFIX };

// A real 1×1 PNG (the same bytes as backend/test/users/avatars.int-spec.ts).
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "base64",
);
// The upload limit (PLAN D11, frontend AVATAR_MAX_BYTES).
const MAX_BYTES = 5 * 1024 * 1024;

const uploadInput = (page: Page) => page.getByLabel("Upload avatar image");
const removeButton = (page: Page) => page.getByRole("button", { name: "Remove avatar" });
// The photo is the only image loaded from this user's avatar URL on the page.
const photo = (page: Page, id: string) => page.locator(`img[src*="/api/users/${id}/avatar"]`);
const profileUrl = (id: string) => `/en/users/${id}/profile`;

async function open(page: Page, id: string) {
  await page.goto(profileUrl(id));
  const name = page.getByRole("textbox", { name: /First Name/ });
  await expect(name).toBeVisible();
  // The page comes with the server HTML (PLAN D6); wait for React before the test picks a file or clicks.
  await waitForHydration(name);
}

/** True once the browser has really loaded and decoded the image (a broken image has a width of 0). */
async function expectLoaded(page: Page, id: string) {
  await expect
    .poll(() => photo(page, id).evaluate((img: HTMLImageElement) => img.naturalWidth))
    .toBeGreaterThan(0);
}

let alphaId: string;
let betaId: string;

test.beforeEach(async ({ context }) => {
  await signIn(context, ADMIN_EMAIL);
  alphaId = await createUser(context, alpha);
  betaId = await createUser(context, beta);
});

test.afterEach(async ({ context }) => {
  await signIn(context, ADMIN_EMAIL);
  await deleteUsersByName(context, PREFIX);
});

test("an employee uploads a PNG, sees it, and it stays after a reload", async ({
  context,
  page,
}) => {
  await signIn(context, testUserEmail(alpha));
  await open(page, alphaId);
  await expect(photo(page, alphaId)).toHaveCount(0);

  await uploadInput(page).setInputFiles({ name: "me.png", mimeType: "image/png", buffer: PNG });

  // `exact`: Radix also copies the toast text into a screen-reader status line.
  await expect(page.getByText("Avatar updated", { exact: true })).toBeVisible();
  await expectLoaded(page, alphaId);

  await page.reload();
  await expectLoaded(page, alphaId);
  // The server HTML already holds the photo (PLAN D6).
  const html = await (await context.request.get(profileUrl(alphaId))).text();
  expect(html).toContain(`/api/users/${alphaId}/avatar?v=`);
});

test("an employee removes their photo, and the initials come back", async ({ context, page }) => {
  await signIn(context, testUserEmail(alpha));
  await open(page, alphaId);
  await uploadInput(page).setInputFiles({ name: "me.png", mimeType: "image/png", buffer: PNG });
  await expectLoaded(page, alphaId);

  // The button shows on hover (Figma "Remove image").
  await photo(page, alphaId).hover();
  await removeButton(page).click();

  await expect(page.getByText("Avatar removed", { exact: true })).toBeVisible();
  await expect(photo(page, alphaId)).toHaveCount(0);
  await expect(removeButton(page)).toBeHidden();
  await page.reload();
  await expect(photo(page, alphaId)).toHaveCount(0);
});

test("a file that is not an image shows the type error (browser check)", async ({
  context,
  page,
}) => {
  await signIn(context, testUserEmail(alpha));
  await open(page, alphaId);

  await uploadInput(page).setInputFiles({
    name: "notes.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("not an image"),
  });

  await expect(
    page.getByText("Only png, jpg or gif images are allowed.", { exact: true }),
  ).toBeVisible();
  await expect(photo(page, alphaId)).toHaveCount(0);
});

test("a text file named .png shows the type error (server checks the first bytes)", async ({
  context,
  page,
}) => {
  await signIn(context, testUserEmail(alpha));
  await open(page, alphaId);

  // The browser sees `image/png` and sends it; the backend reads the content and answers 415.
  await uploadInput(page).setInputFiles({
    name: "fake.png",
    mimeType: "image/png",
    buffer: Buffer.from("not an image"),
  });

  await expect(
    page.getByText("Only png, jpg or gif images are allowed.", { exact: true }),
  ).toBeVisible();
  await expect(photo(page, alphaId)).toHaveCount(0);
});

test("a file over 5 MB shows the size error", async ({ context, page }) => {
  await signIn(context, testUserEmail(alpha));
  await open(page, alphaId);

  // A PNG start, padded to one byte over the limit.
  const tooLarge = Buffer.concat([PNG, Buffer.alloc(MAX_BYTES + 1 - PNG.length)]);
  await uploadInput(page).setInputFiles({
    name: "big.png",
    mimeType: "image/png",
    buffer: tooLarge,
  });

  await expect(page.getByText("File size must not exceed 5 MB.", { exact: true })).toBeVisible();
  await expect(photo(page, alphaId)).toHaveCount(0);
});

test("an employee on another employee's profile sees no upload or remove control", async ({
  context,
  page,
}) => {
  // Beta has a photo, so a Remove button would show if the page allowed it.
  await signIn(context, testUserEmail(beta));
  await open(page, betaId);
  await uploadInput(page).setInputFiles({ name: "me.png", mimeType: "image/png", buffer: PNG });
  await expectLoaded(page, betaId);

  await signIn(context, testUserEmail(alpha));
  await open(page, betaId);

  await expectLoaded(page, betaId);
  await expect(uploadInput(page)).toHaveCount(0);
  await expect(page.getByText("Upload avatar image")).toHaveCount(0);
  await expect(removeButton(page)).toHaveCount(0);
});
