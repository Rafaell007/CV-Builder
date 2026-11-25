# User profile

The rules of the profile fields that more than one form edits (KAN-105): first and last name, department and position.

- `userProfileRules(messages)`: the Zod rules of those four fields, all required; names are trimmed (a name of spaces is empty) and at most `USER_NAME_MAX_LENGTH` (100) characters, like the backend `UpdateUserInput` / `UpdateProfileInput`. Spread them into the form's `z.object`. Texts come translated from the caller (`UserProfileRuleMessages`).
- `USER_NAME_MAX_LENGTH`: also the `{max}` value of the "too long" messages.
- Used by: `features/users` (Create and Update user modals, which add email, password and role), `features/user-details` (Profile tab).
- Docs: [docs/pages/11-user-profile-page.md](../../../../docs/pages/11-user-profile-page.md).
