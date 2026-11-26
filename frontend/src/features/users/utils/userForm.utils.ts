import { z } from "zod";
import type { CreateUserInput, Role, UpdateUserInput } from "@/shared/graphql";
import {
  emailProblem,
  passwordProblem,
  type EmailProblem,
  type PasswordProblem,
} from "@/shared/utils";
import { userProfileRules, type UserProfileRuleMessages } from "@/shared/userProfile";
import type { UserFormSubmit, UserFormValues, UserListItem } from "../users.types";

/** The translated texts of the rules both forms share: the profile rules (names, department, position) and role. */
export type UpdateUserFormMessages = UserProfileRuleMessages & { roleRequired: string };

/** The translated texts of the Create user rules. Email and password keys are the shared `emailProblem` / `passwordProblem` ones. */
export type CreateUserFormMessages = Record<EmailProblem | PasswordProblem, string> &
  UpdateUserFormMessages;

const ROLES = ["ADMIN", "USER"] as const satisfies readonly Role[];

/** The rules of the fields that Create and Update both send: the shared profile rules and the role. */
function sharedRules(messages: UpdateUserFormMessages) {
  return {
    ...userProfileRules(messages),
    role: z.enum(ROLES, { error: messages.roleRequired }),
  };
}

/**
 * The rules of the Create user form (users page, Create User modal). The email and password rules are the shared ones of
 * sign-up (password D33: 8–128 characters, a letter and a digit, not the doc's 6). Every field is required. The
 * backend checks everything again and also says when the email is taken.
 */
export function createUserFormSchema(
  messages: CreateUserFormMessages,
): z.ZodType<UserFormSubmit, UserFormValues> {
  return z.object({
    email: z
      .string()
      .trim()
      .superRefine((email, context) => {
        const problem = emailProblem(email);
        if (problem) context.addIssue({ code: "custom", message: messages[problem] });
      }),
    // Not trimmed: spaces are part of a password.
    password: z.string().superRefine((password, context) => {
      const problem = passwordProblem(password);
      if (problem) context.addIssue({ code: "custom", message: messages[problem] });
    }),
    ...sharedRules(messages),
  });
}

/**
 * The rules of the Update user form (users page, Update User modal). Email and Password are shown disabled and are
 * not sent, so they pass unchecked. The other fields follow the Create rules.
 */
export function updateUserFormSchema(
  messages: UpdateUserFormMessages,
): z.ZodType<UserFormSubmit, UserFormValues> {
  return z.object({
    email: z.string(),
    password: z.string(),
    ...sharedRules(messages),
  });
}

/** The `createUser` input. The backend lowercases the email. */
export function toCreateUserInput(values: UserFormSubmit): CreateUserInput {
  return {
    email: values.email,
    password: values.password,
    firstName: values.firstName,
    lastName: values.lastName,
    departmentId: values.departmentId,
    positionId: values.positionId,
    role: values.role,
  };
}

/**
 * The Update user fields filled with the current data of `user`. A user who signed up can miss names, department and
 * position: those fields start empty, and the rules ask for them. The password is never loaded.
 */
export function toUserFormValues(user: UserListItem): UserFormValues {
  return {
    email: user.email,
    password: "",
    firstName: user.firstName ?? "",
    lastName: user.lastName ?? "",
    departmentId: user.department?.id ?? "",
    positionId: user.position?.id ?? "",
    role: user.role,
  };
}

/** The `updateUser` input of `user`: everything but the email and the password, which cannot change here. */
export function toUpdateUserInput(user: UserListItem, values: UserFormSubmit): UpdateUserInput {
  return {
    id: user.id,
    firstName: values.firstName,
    lastName: values.lastName,
    departmentId: values.departmentId,
    positionId: values.positionId,
    role: values.role,
  };
}
