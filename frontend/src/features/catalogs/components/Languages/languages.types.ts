import type { LanguagesQuery } from "@/shared/graphql";

/** One row of the languages list, as the `Languages` query returns it: the name, the ISO code and the native name. */
export type LanguageListItem = LanguagesQuery["languages"]["items"][number];

/** What the Create and Update language requests send. The backend trims the texts and uppercases the ISO code again. */
export interface LanguageInput {
  name: string;
  iso: string;
  nativeName: string;
}

/** What the Create and Update language form holds while the user types: the same three fields as the request. */
export type LanguageFormValues = LanguageInput;
