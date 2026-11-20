"use client";

import { useMutation } from "@apollo/client/react";
import { ProjectsDocument, UpdateProjectDocument, type UpdateProjectInput } from "@/shared/graphql";
import type { ProjectListItem } from "../projects.types";

export type UseUpdateProjectResult = {
  /** True while the request runs. */
  pending: boolean;
  /** Sends `updateProject`. Resolves with the saved project. Rejects with the request's error, so the caller can show it and keep the form values. */
  update: (input: UpdateProjectInput) => Promise<ProjectListItem>;
};

/**
 * The `updateProject` request (AC-28). On success the open `Projects` list loads again: a changed name or date
 * can move the project in the sorted, searched and cut list, and only the backend knows where. The stored lists of
 * all other searches and pages are removed, so opening one of them asks the backend again.
 */
export function useUpdateProject(): UseUpdateProjectResult {
  const [updateProject, { loading }] = useMutation(UpdateProjectDocument);

  async function update(input: UpdateProjectInput): Promise<ProjectListItem> {
    const { data } = await updateProject({
      variables: { input },
      // The lists of other searches and pages stay in the cache. One of them can hold this project under its old
      // name, and the user can open it again: it must come from the backend then.
      update: (cache) => void cache.evict({ id: "ROOT_QUERY", fieldName: "projects" }),
      refetchQueries: [ProjectsDocument],
    });
    // `useMutation` rejects on an error, so a missing result is not expected; fail loudly if it ever happens.
    if (!data) throw new Error("updateProject returned no project");
    return data.updateProject;
  }

  return { pending: loading, update };
}
