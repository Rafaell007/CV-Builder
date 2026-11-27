import { z } from "zod";
import { USER_NAME_MAX_LENGTH } from "../userProfile.constants";

/** The translated texts of the profile rules. */
export type UserProfileRuleMessages = {
  firstNameRequired: string;
  firstNameTooLong: string;
  lastNameRequired: string;
  lastNameTooLong: string;
  departmentRequired: string;
  positionRequired: string;
};

// A trimmed, required name of at most 100 characters: a name of spaces counts as empty.
const nameRule = (required: string, tooLong: string) =>
  z.string().trim().min(1, required).max(USER_NAME_MAX_LENGTH, tooLong);

// A select holds "" while nothing is chosen.
const chosenRule = (required: string) => z.string().min(1, required);

/**
 * The Zod rules of the profile fields: first and last name, department and position, all required. Spread them into a
 * form's `z.object` (Create and Update user modals, Profile tab). The backend checks them again.
 */
export function userProfileRules(messages: UserProfileRuleMessages) {
  return {
    firstName: nameRule(messages.firstNameRequired, messages.firstNameTooLong),
    lastName: nameRule(messages.lastNameRequired, messages.lastNameTooLong),
    departmentId: chosenRule(messages.departmentRequired),
    positionId: chosenRule(messages.positionRequired),
  };
}
