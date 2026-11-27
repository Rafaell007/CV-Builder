import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { getRequest, getRequestUser } from "../../../common/auth";
import { Role } from "../../auth/models/role.enum";
import { canonicalId } from "../user-lock";

/**
 * Refuses a write on an avatar before Nest reads the upload (guards run before the file interceptor), so a user
 * who may not change it cannot make the server read 5 MB. Only the owner or an admin may pass.
 * This is a first check on the role in the token. The service checks again under the row lock, with the data as
 * it is now, and stays the one that decides (a parallel request may have changed the actor since).
 * Not signed in is not handled here: the global `JwtAuthGuard` answers 401 first.
 */
@Injectable()
export class AvatarActorGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const actor = getRequestUser(context);
    const { id } = getRequest<{ params: { id?: string } }>(context).params;
    const mayChange =
      actor !== undefined &&
      (actor.role === Role.ADMIN ||
        (id !== undefined && canonicalId(id) === canonicalId(actor.id)));
    if (!mayChange) throw new ForbiddenException("You are not allowed to do this");
    return true;
  }
}
