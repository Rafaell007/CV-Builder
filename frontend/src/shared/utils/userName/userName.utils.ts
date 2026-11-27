/** The parts of a user that make up the name to show. Names are optional: a user who signed up has none yet. */
export type NamedUser = {
  email: string;
  firstName?: string | null;
  lastName?: string | null;
};

/**
 * The name to show for a user: first and last name, or only the one that is filled. A user who signed up and never
 * filled the profile has no name, so the email stands in for it (avatar initials, sidebar, breadcrumbs, toasts).
 */
export function getUserDisplayName({ email, firstName, lastName }: NamedUser): string {
  const name = [firstName, lastName]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(" ");
  return name || email;
}
