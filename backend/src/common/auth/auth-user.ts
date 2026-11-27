import type { Role } from "../../generated/prisma/enums";

/** The signed-in user as guards and resolvers see it; the JWT guard (Phase 3) puts it on `request.user`. */
export interface AuthUser {
  id: string;
  role: Role;
  isVerified: boolean;
}
