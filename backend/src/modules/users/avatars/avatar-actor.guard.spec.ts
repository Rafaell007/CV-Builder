import { ForbiddenException } from "@nestjs/common";
import type { AuthUser } from "../../../common/auth";
import { httpContext } from "../../../common/auth/execution-context.testing";
import { Role } from "../../../generated/prisma/enums";
import { AvatarActorGuard } from "./avatar-actor.guard";
import { AvatarsController } from "./avatars.controller";

const OWNER_ID = "6f1d3c52-8a0e-4f6c-9a43-2b7d5e1c9a10";
const OWNER: AuthUser = { id: OWNER_ID, role: Role.USER, isVerified: false };
const OTHER: AuthUser = {
  id: "0b8e9a3c-1f2d-4e5a-8b6c-7d9e0f1a2b3c",
  role: Role.USER,
  isVerified: true,
};
const ADMIN: AuthUser = {
  id: "9c1a7e44-5d3b-4a8f-b2e6-0f4d8c7a1b35",
  role: Role.ADMIN,
  isVerified: true,
};

function context(actor: AuthUser | undefined, id: string) {
  return httpContext(AvatarsController, () => undefined, actor, {}, { id });
}

describe("AvatarActorGuard", () => {
  const guard = new AvatarActorGuard();

  it("lets the owner through", () => {
    expect(guard.canActivate(context(OWNER, OWNER_ID))).toBe(true);
  });

  it("lets the owner through when the id in the path has capital letters", () => {
    expect(guard.canActivate(context(OWNER, OWNER_ID.toUpperCase()))).toBe(true);
  });

  it("lets an admin through for another user", () => {
    expect(guard.canActivate(context(ADMIN, OWNER_ID))).toBe(true);
  });

  it.each([
    ["another user", OTHER, OWNER_ID],
    ["a user and an id that is not a UUID", OTHER, "not-a-uuid"],
    ["a request without a user", undefined, OWNER_ID],
  ])("refuses %s with 403", (_name, actor, id) => {
    expect(() => guard.canActivate(context(actor, id))).toThrow(ForbiddenException);
  });
});
