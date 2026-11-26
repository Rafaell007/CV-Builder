import { InputType, OmitType } from "@nestjs/graphql";
import { UpdateUserInput } from "./update-user.input";

/**
 * The owner or an admin updates a profile (User Details, Profile tab): the Update User fields without the role, which
 * only an admin changes in the Users page.
 */
@InputType()
export class UpdateProfileInput extends OmitType(UpdateUserInput, ["role"] as const) {}
