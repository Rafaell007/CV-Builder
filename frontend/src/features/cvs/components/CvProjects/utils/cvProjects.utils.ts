import type { CvProjectsQueryVariables } from "@/shared/graphql";
import type { CvProjectsListState } from "../cvProjects.types";

/**
 * Turns the choices of the user into the variables of the `CvProjects` query.
 * The sort is always sent: the list starts sorted by name ascending and a click only switches direction or column.
 * An empty search is left out. Without it the backend returns every project of the CV.
 */
export function toCvProjectsVariables(
  cvId: string,
  { search, sort }: CvProjectsListState,
): CvProjectsQueryVariables {
  const text = search.trim();
  return { cvId, sort, ...(text === "" ? {} : { search: text }) };
}

/**
 * The responsibilities of a CV project as tags: one tag per line of the text, blank lines left out.
 * The text is free text from the form; a text of one line is one tag.
 */
export function toResponsibilityTags(responsibilities: string | null | undefined): string[] {
  return (responsibilities ?? "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line !== "");
}
