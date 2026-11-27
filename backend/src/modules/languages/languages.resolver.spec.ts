import { Role } from "../../generated/prisma/enums";
import { LanguagesResolver } from "./languages.resolver";
import type { LanguagesService } from "./languages.service";

const LANGUAGE_ID = "6f1d3c52-8a0e-4f6c-9a43-2b7d5e1c9a10";

function setup() {
  const service = {
    list: jest.fn().mockResolvedValue({ items: [], total: 0 }),
    create: jest.fn().mockResolvedValue({ id: LANGUAGE_ID }),
    update: jest.fn().mockResolvedValue({ id: LANGUAGE_ID }),
    delete: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<LanguagesService>;
  return { resolver: new LanguagesResolver(service), service };
}

describe("LanguagesResolver", () => {
  it("is for admins only", () => {
    expect(Reflect.getMetadata("auth:roles", LanguagesResolver)).toEqual([Role.ADMIN]);
    expect(Reflect.getMetadata("auth:isPublic", LanguagesResolver)).toBeUndefined();
  });

  it("list passes the arguments to the service", async () => {
    const { resolver, service } = setup();
    const args = { search: "eng", page: { number: 1, size: 20 } };

    await expect(resolver.list(args)).resolves.toEqual({ items: [], total: 0 });

    expect(service.list).toHaveBeenCalledWith(args);
  });

  it("createLanguage and updateLanguage pass the input to the service", async () => {
    const { resolver, service } = setup();
    const input = { id: LANGUAGE_ID, name: "English", iso: "EN", nativeName: "English" };

    await expect(resolver.createLanguage(input)).resolves.toEqual({ id: LANGUAGE_ID });
    await expect(resolver.updateLanguage(input)).resolves.toEqual({ id: LANGUAGE_ID });

    expect(service.create).toHaveBeenCalledWith(input);
    expect(service.update).toHaveBeenCalledWith(input);
  });

  it("deleteLanguage returns true after the service deleted the language", async () => {
    const { resolver, service } = setup();

    await expect(resolver.deleteLanguage(LANGUAGE_ID)).resolves.toBe(true);

    expect(service.delete).toHaveBeenCalledWith(LANGUAGE_ID);
  });
});
