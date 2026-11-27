import { UnauthorizedException } from "@nestjs/common";
import { IS_PUBLIC_KEY, ROLES_KEY, VERIFIED_KEY } from "../../common/auth/decorators";
import { Role } from "../../generated/prisma/enums";
import { UsersResolver } from "./users.resolver";
import type { UsersService } from "./users.service";

const USER_ID = "6f1d3c52-8a0e-4f6c-9a43-2b7d5e1c9a10";
const ACTOR = {
  id: "0b8e9a3c-1f2d-4e5a-8b6c-7d9e0f1a2b3c",
  role: Role.ADMIN,
  isVerified: true,
};
const PROFILE = {
  firstName: "Alpha",
  lastName: "Lima",
  departmentId: "1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d",
  positionId: "2b3c4d5e-6f7a-4b8c-9d0e-1f2a3b4c5d6e",
  role: Role.USER,
};

function setup() {
  const service = {
    list: jest.fn().mockResolvedValue({ items: [], total: 0 }),
    findOne: jest.fn().mockResolvedValue({ id: USER_ID }),
    create: jest.fn().mockResolvedValue({ id: USER_ID }),
    update: jest.fn().mockResolvedValue({ id: USER_ID }),
    updateProfile: jest.fn().mockResolvedValue({ id: USER_ID }),
    delete: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<UsersService>;
  return { resolver: new UsersResolver(service), service };
}

const handler = (name: keyof UsersResolver): unknown => UsersResolver.prototype[name];

describe("UsersResolver", () => {
  it("needs a signed-in user for everything: nothing is public and the class has no role limit", () => {
    expect(Reflect.getMetadata(IS_PUBLIC_KEY, UsersResolver)).toBeUndefined();
    expect(Reflect.getMetadata(ROLES_KEY, UsersResolver)).toBeUndefined();
  });

  it.each(["list", "user", "updateProfile"] as const)(
    "%s is open to every signed-in user, verified or not",
    (name) => {
      expect(Reflect.getMetadata(ROLES_KEY, handler(name) as object)).toBeUndefined();
      expect(Reflect.getMetadata(VERIFIED_KEY, handler(name) as object)).toBeUndefined();
      expect(Reflect.getMetadata(IS_PUBLIC_KEY, handler(name) as object)).toBeUndefined();
    },
  );

  it.each(["createUser", "updateUser", "deleteUser"] as const)("%s is for admins only", (name) => {
    expect(Reflect.getMetadata(ROLES_KEY, handler(name) as object)).toEqual([Role.ADMIN]);
  });

  it("users passes the arguments to the service", async () => {
    const { resolver, service } = setup();
    const args = { search: "alpha", page: { number: 1, size: 20 } };

    await expect(resolver.list(args)).resolves.toEqual({ items: [], total: 0 });

    expect(service.list).toHaveBeenCalledWith(args);
  });

  it("user passes the id to the service", async () => {
    const { resolver, service } = setup();

    await expect(resolver.user(USER_ID)).resolves.toEqual({ id: USER_ID });

    expect(service.findOne).toHaveBeenCalledWith(USER_ID);
  });

  it("createUser passes the input to the service", async () => {
    const { resolver, service } = setup();
    const input = { ...PROFILE, email: "alpha@example.com", password: "secret12" };

    await expect(resolver.createUser(input)).resolves.toEqual({ id: USER_ID });

    expect(service.create).toHaveBeenCalledWith(input);
  });

  it("updateUser passes the input and the signed-in admin's id to the service", async () => {
    const { resolver, service } = setup();
    const input = { id: USER_ID, ...PROFILE };

    await expect(resolver.updateUser(ACTOR, input)).resolves.toEqual({ id: USER_ID });

    expect(service.update).toHaveBeenCalledWith(input, ACTOR.id);
  });

  it("updateProfile passes the input and the signed-in user's id to the service", async () => {
    const { resolver, service } = setup();
    const input = {
      id: USER_ID,
      firstName: PROFILE.firstName,
      lastName: PROFILE.lastName,
      departmentId: PROFILE.departmentId,
      positionId: PROFILE.positionId,
    };

    await expect(resolver.updateProfile(ACTOR, input)).resolves.toEqual({ id: USER_ID });

    expect(service.updateProfile).toHaveBeenCalledWith(input, ACTOR.id);
  });

  it("deleteUser returns true after the service deleted the user as the signed-in admin", async () => {
    const { resolver, service } = setup();

    await expect(resolver.deleteUser(ACTOR, USER_ID)).resolves.toBe(true);

    expect(service.delete).toHaveBeenCalledWith(USER_ID, ACTOR.id);
  });

  it("refuses a mutation without a signed-in user, which the global guard normally stops first", async () => {
    const { resolver, service } = setup();

    await expect(resolver.deleteUser(undefined, USER_ID)).rejects.toThrow(UnauthorizedException);
    expect(() => resolver.updateUser(undefined, { id: USER_ID, ...PROFILE })).toThrow(
      UnauthorizedException,
    );
    expect(service.delete).not.toHaveBeenCalled();
    expect(service.update).not.toHaveBeenCalled();
  });
});
