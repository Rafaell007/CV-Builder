import { INestApplication } from "@nestjs/common";
import { Proficiency, Role } from "../../src/generated/prisma/enums";
import { PrismaService } from "../../src/prisma/prisma.service";
import { createTestApp } from "../support/create-test-app";
import { createUser, TEST_PASSWORD } from "../support/create-user";
import { graphqlRequest, toCookiePair } from "../support/graphql-request";

const SIGN_IN = `mutation ($input: SignInInput!) { signIn(input: $input) { id } }`;

const FIELDS = "id name iso nativeName";
const LIST = `query ($search: String, $sort: SortInput, $page: PageInput) {
  languages(search: $search, sort: $sort, page: $page) { items { ${FIELDS} } total }
}`;
const CREATE = `mutation ($input: CreateLanguageInput!) { createLanguage(input: $input) { ${FIELDS} } }`;
const UPDATE = `mutation ($input: UpdateLanguageInput!) { updateLanguage(input: $input) { ${FIELDS} } }`;
const DELETE = `mutation ($id: ID!) { deleteLanguage(id: $id) }`;

const MISSING_ID = "00000000-0000-4000-8000-000000000000";

interface LanguageInput {
  name: string;
  iso: string;
  nativeName: string;
}

const GERMAN: LanguageInput = { name: "German", iso: "DE", nativeName: "Deutsch" };
const ENGLISH: LanguageInput = { name: "English", iso: "EN", nativeName: "English" };
const POLISH: LanguageInput = { name: "Polish", iso: "PL", nativeName: "Polski" };

describe("languages", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let admin: string[];
  let user: string[];

  async function signIn(email: string): Promise<string[]> {
    const { setCookies } = await graphqlRequest(app, SIGN_IN, {
      variables: { input: { email, password: TEST_PASSWORD } },
    });
    return setCookies.map(toCookiePair);
  }

  async function createLanguage(input: LanguageInput): Promise<string> {
    const { body } = await graphqlRequest(app, CREATE, { cookies: admin, variables: { input } });
    expect(body.errors).toBeUndefined();
    return (body.data as { createLanguage: { id: string } }).createLanguage.id;
  }

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get(PrismaService);
    await createUser(app, { email: "admin@example.com", role: Role.ADMIN });
    await createUser(app, { email: "user@example.com" });
    admin = await signIn("admin@example.com");
    user = await signIn("user@example.com");
  });

  beforeEach(async () => {
    await prisma.userLanguage.deleteMany();
    await prisma.language.deleteMany();
  });

  afterAll(async () => {
    await app.close();
  });

  describe("authorization", () => {
    const operations: [string, string, Record<string, unknown>][] = [
      ["languages", LIST, {}],
      ["createLanguage", CREATE, { input: GERMAN }],
      ["updateLanguage", UPDATE, { input: { id: MISSING_ID, ...GERMAN } }],
      ["deleteLanguage", DELETE, { id: MISSING_ID }],
    ];

    it.each(operations)(
      "%s refuses a visitor who is not signed in",
      async (_name, query, variables) => {
        const { body } = await graphqlRequest(app, query, { variables });

        expect(body.errors?.[0]?.extensions.code).toBe("UNAUTHENTICATED");
      },
    );

    it.each(operations)(
      "%s refuses a user who is not an admin",
      async (_name, query, variables) => {
        const { body } = await graphqlRequest(app, query, { cookies: user, variables });

        expect(body.errors?.[0]?.extensions.code).toBe("FORBIDDEN");
      },
    );

    it("does not change data when a user who is not an admin tries to create a language", async () => {
      await graphqlRequest(app, CREATE, { cookies: user, variables: { input: GERMAN } });

      await expect(prisma.language.count()).resolves.toBe(0);
    });
  });

  describe("createLanguage", () => {
    it("creates a language, normalises the name, trims the native name and uppercases the ISO code", async () => {
      const { body } = await graphqlRequest(app, CREATE, {
        cookies: admin,
        variables: {
          input: { name: "  Brazilian   Portuguese ", iso: " pt-br ", nativeName: " Português " },
        },
      });

      expect(body.errors).toBeUndefined();
      const created = (body.data as { createLanguage: { id: string } }).createLanguage;
      const expected = { name: "Brazilian Portuguese", iso: "PT-BR", nativeName: "Português" };
      expect(created).toMatchObject(expected);
      await expect(
        prisma.language.findUniqueOrThrow({ where: { id: created.id } }),
      ).resolves.toMatchObject(expected);
    });

    it.each([
      ["name", "an empty name", { ...GERMAN, name: "" }],
      ["name", "a name of only spaces", { ...GERMAN, name: "   " }],
      ["name", "a name longer than 100 characters", { ...GERMAN, name: "a".repeat(101) }],
      ["iso", "an empty ISO code", { ...GERMAN, iso: "" }],
      ["iso", "an ISO code of only spaces", { ...GERMAN, iso: "  " }],
      ["iso", "an ISO code longer than 5 characters", { ...GERMAN, iso: "ABCDEF" }],
      ["iso", "an ISO code with a digit", { ...GERMAN, iso: "D1" }],
      ["iso", "an ISO code with a space inside", { ...GERMAN, iso: "D E" }],
      [
        "iso",
        "an ISO code with a non-ASCII letter that uppercases to ASCII",
        { ...GERMAN, iso: "ß" },
      ],
      ["iso", "an ISO code with a dotless i", { ...GERMAN, iso: "ı" }],
      ["nativeName", "an empty native name", { ...GERMAN, nativeName: "" }],
      ["nativeName", "a native name of only spaces", { ...GERMAN, nativeName: "  " }],
      [
        "nativeName",
        "a native name longer than 100 characters",
        { ...GERMAN, nativeName: "a".repeat(101) },
      ],
    ])("rejects on %s %s with a field error", async (field, _case, input) => {
      const { body } = await graphqlRequest(app, CREATE, { cookies: admin, variables: { input } });

      expect(body.errors?.[0]?.extensions).toMatchObject({
        code: "BAD_USER_INPUT",
        fieldErrors: [expect.objectContaining({ field })],
      });
      await expect(prisma.language.count()).resolves.toBe(0);
    });

    it("accepts a name of 100 characters and an ISO code of 5", async () => {
      await createLanguage({ name: "a".repeat(100), iso: "AB-CD", nativeName: "b".repeat(100) });

      await expect(prisma.language.count()).resolves.toBe(1);
    });

    it.each([
      ["the same name", "German"],
      ["spaces around and inside", "  German "],
      ["other letter case", "GERMAN"],
    ])("fails with CONFLICT for a name that already exists, with %s (D35)", async (_case, name) => {
      await createLanguage(GERMAN);

      const { body } = await graphqlRequest(app, CREATE, {
        cookies: admin,
        variables: { input: { name, iso: "XX", nativeName: "Deutsch" } },
      });

      expect(body.errors?.[0]).toMatchObject({
        message: "Language already exists",
        extensions: { code: "CONFLICT" },
      });
      await expect(prisma.language.count()).resolves.toBe(1);
    });

    it.each([
      ["the same ISO code", "DE"],
      ["the ISO code in lowercase", "de"],
    ])("fails with CONFLICT for an ISO code that already exists, with %s", async (_case, iso) => {
      await createLanguage(GERMAN);

      const { body } = await graphqlRequest(app, CREATE, {
        cookies: admin,
        variables: { input: { name: "Deutsch", iso, nativeName: "Deutsch" } },
      });

      expect(body.errors?.[0]).toMatchObject({
        message: "ISO code already exists",
        extensions: { code: "CONFLICT" },
      });
      await expect(prisma.language.count()).resolves.toBe(1);
    });
  });

  describe("database rules", () => {
    it("refuses a name that differs only in letter case, even without the service (D35)", async () => {
      await prisma.language.create({ data: GERMAN });

      await expect(
        prisma.language.create({ data: { ...GERMAN, name: "german", iso: "XX" } }),
      ).rejects.toThrow();
    });

    it("refuses a name longer than 100 characters, even without the service", async () => {
      await expect(
        prisma.language.create({ data: { ...GERMAN, name: "a".repeat(101) } }),
      ).rejects.toThrow();
    });

    it("refuses a lowercase ISO code, even without the service", async () => {
      await expect(prisma.language.create({ data: { ...GERMAN, iso: "de" } })).rejects.toThrow();
    });
  });

  describe("languages", () => {
    beforeEach(async () => {
      for (const input of [POLISH, ENGLISH, GERMAN]) {
        await createLanguage(input);
      }
    });

    async function names(variables: Record<string, unknown> = {}): Promise<string[]> {
      const { body } = await graphqlRequest(app, LIST, { cookies: admin, variables });
      expect(body.errors).toBeUndefined();
      return (body.data as { languages: { items: { name: string }[] } }).languages.items.map(
        (language) => language.name,
      );
    }

    it("lists the languages with all fields and the total, sorted by name by default", async () => {
      const { body } = await graphqlRequest(app, LIST, { cookies: admin });

      const page = (body.data as { languages: { items: LanguageInput[]; total: number } })
        .languages;
      expect(page.items).toEqual([
        expect.objectContaining(ENGLISH),
        expect.objectContaining(GERMAN),
        expect.objectContaining(POLISH),
      ]);
      expect(page.total).toBe(3);
    });

    it("sorts by name descending", async () => {
      await expect(names({ sort: { field: "name", direction: "DESC" } })).resolves.toEqual([
        "Polish",
        "German",
        "English",
      ]);
    });

    it("sorts by ISO code", async () => {
      await createLanguage({ name: "Czech", iso: "CS", nativeName: "Čeština" });

      await expect(names({ sort: { field: "iso", direction: "ASC" } })).resolves.toEqual([
        "Czech",
        "German",
        "English",
        "Polish",
      ]);
    });

    it("sorts by name without regard to letter case (D35)", async () => {
      await createLanguage({ name: "czech", iso: "CS", nativeName: "Čeština" });

      await expect(names()).resolves.toEqual(["czech", "English", "German", "Polish"]);
    });

    it("searches the name without regard to case", async () => {
      await expect(names({ search: "GER" })).resolves.toEqual(["German"]);
    });

    it("searches only the name, not the ISO code or the native name", async () => {
      await expect(names({ search: "Deutsch" })).resolves.toEqual([]);
    });

    it("searches, sorts and pages together, and keeps the total of all matches", async () => {
      await createLanguage({ name: "Swiss German", iso: "GSW", nativeName: "Schwiizertüütsch" });

      const { body } = await graphqlRequest(app, LIST, {
        cookies: admin,
        variables: {
          search: "german",
          sort: { field: "name", direction: "DESC" },
          page: { number: 2, size: 1 },
        },
      });

      const page = (body.data as { languages: { items: { name: string }[]; total: number } })
        .languages;
      expect(page.items.map((language) => language.name)).toEqual(["German"]);
      expect(page.total).toBe(2);
    });

    it("rejects a sort field that is not allowed", async () => {
      const { body } = await graphqlRequest(app, LIST, {
        cookies: admin,
        variables: { sort: { field: "nativeName", direction: "ASC" } },
      });

      expect(body.errors?.[0]?.extensions.code).toBe("BAD_USER_INPUT");
    });
  });

  describe("updateLanguage", () => {
    it("updates every field and normalises them like create", async () => {
      const id = await createLanguage(GERMAN);

      const { body } = await graphqlRequest(app, UPDATE, {
        cookies: admin,
        variables: {
          input: { id, name: " Austrian  German ", iso: "de-at", nativeName: " Deutsch " },
        },
      });

      expect(body).toEqual({
        data: {
          updateLanguage: { id, name: "Austrian German", iso: "DE-AT", nativeName: "Deutsch" },
        },
      });
    });

    it("allows saving an unchanged language", async () => {
      const id = await createLanguage(GERMAN);

      const { body } = await graphqlRequest(app, UPDATE, {
        cookies: admin,
        variables: { input: { id, ...GERMAN } },
      });

      expect(body.errors).toBeUndefined();
    });

    it("allows changing only the letter case of its own name", async () => {
      const id = await createLanguage(GERMAN);

      const { body } = await graphqlRequest(app, UPDATE, {
        cookies: admin,
        variables: { input: { id, ...GERMAN, name: "GERMAN" } },
      });

      expect(body).toEqual({ data: { updateLanguage: { id, ...GERMAN, name: "GERMAN" } } });
    });

    it("fails with CONFLICT for the name of another language, in any letter case", async () => {
      await createLanguage(ENGLISH);
      const id = await createLanguage(GERMAN);

      const { body } = await graphqlRequest(app, UPDATE, {
        cookies: admin,
        variables: { input: { id, ...GERMAN, name: "eNGLISH" } },
      });

      expect(body.errors?.[0]).toMatchObject({
        message: "Language already exists",
        extensions: { code: "CONFLICT" },
      });
      await expect(prisma.language.findUniqueOrThrow({ where: { id } })).resolves.toMatchObject(
        GERMAN,
      );
    });

    it("fails with CONFLICT for the ISO code of another language", async () => {
      await createLanguage(ENGLISH);
      const id = await createLanguage(GERMAN);

      const { body } = await graphqlRequest(app, UPDATE, {
        cookies: admin,
        variables: { input: { id, ...GERMAN, iso: "en" } },
      });

      expect(body.errors?.[0]).toMatchObject({
        message: "ISO code already exists",
        extensions: { code: "CONFLICT" },
      });
      await expect(prisma.language.findUniqueOrThrow({ where: { id } })).resolves.toMatchObject(
        GERMAN,
      );
    });

    it("fails with NOT_FOUND for an unknown language", async () => {
      const { body } = await graphqlRequest(app, UPDATE, {
        cookies: admin,
        variables: { input: { id: MISSING_ID, ...GERMAN } },
      });

      expect(body.errors?.[0]).toMatchObject({
        message: "Language not found",
        extensions: { code: "NOT_FOUND" },
      });
    });

    it("rejects an id that is not a UUID with a field error", async () => {
      const { body } = await graphqlRequest(app, UPDATE, {
        cookies: admin,
        variables: { input: { id: "1", ...GERMAN } },
      });

      expect(body.errors?.[0]?.extensions).toMatchObject({
        code: "BAD_USER_INPUT",
        fieldErrors: [expect.objectContaining({ field: "id" })],
      });
    });
  });

  describe("deleteLanguage", () => {
    it("deletes the language", async () => {
      const id = await createLanguage(GERMAN);

      const { body } = await graphqlRequest(app, DELETE, { cookies: admin, variables: { id } });

      expect(body).toEqual({ data: { deleteLanguage: true } });
      await expect(prisma.language.count()).resolves.toBe(0);
    });

    it("fails with CONFLICT when a user still has the language, and keeps both (D18)", async () => {
      const id = await createLanguage(GERMAN);
      const { id: userId } = await prisma.user.findUniqueOrThrow({
        where: { email: "user@example.com" },
      });
      await prisma.userLanguage.create({
        data: { userId, languageId: id, proficiency: Proficiency.B2 },
      });

      const { body } = await graphqlRequest(app, DELETE, { cookies: admin, variables: { id } });

      expect(body.errors?.[0]).toMatchObject({
        message: "Language cannot be deleted because it is currently in use",
        extensions: { code: "CONFLICT" },
      });
      await expect(prisma.language.count()).resolves.toBe(1);
      await expect(prisma.userLanguage.count()).resolves.toBe(1);
    });

    it("fails with NOT_FOUND for an unknown language", async () => {
      const { body } = await graphqlRequest(app, DELETE, {
        cookies: admin,
        variables: { id: MISSING_ID },
      });

      expect(body.errors?.[0]).toMatchObject({
        message: "Language not found",
        extensions: { code: "NOT_FOUND" },
      });
    });

    it("fails with BAD_USER_INPUT for an id that is not a UUID", async () => {
      const { body } = await graphqlRequest(app, DELETE, {
        cookies: admin,
        variables: { id: "1" },
      });

      expect(body.errors?.[0]?.extensions.code).toBe("BAD_USER_INPUT");
    });
  });
});
