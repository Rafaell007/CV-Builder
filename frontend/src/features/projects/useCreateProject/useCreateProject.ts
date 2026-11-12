"use client";

import { useMutation } from "@apollo/client/react";
import { CreateProjectDocument, ProjectsDocument, type CreateProjectInput } from "@/shared/graphql";
import type { ProjectListItem } from "../projects.types";

export type UseCreateProjectResult = {
  /** True while the request runs. */
  pending: boolean;
  /** Sends `createProject`. Resolves with the new project. Rejects with the request's error, so the caller can show it and keep the form values. */
  create: (input: CreateProjectInput) => Promise<ProjectListItem>;
};

/**
 * The `createProject` request (AC-14). On success the open `Projects` list loads again: the new project belongs
 * in the sorted, searched and cut list at a place only the backend knows, and the total changes.
 */
export function useCreateProject(): UseCreateProjectResult {
  const [createProject, { loading }] = useMutation(CreateProjectDocument);

  async function create(input: CreateProjectInput): Promise<ProjectListItem> {
    const { data } = await createProject({
      variables: { input },
      refetchQueries: [ProjectsDocument],
    });
    // `useMutation` rejects on an error, so a missing result is not expected; fail loudly if it ever happens.
    if (!data) throw new Error("createProject returned no project");
    return data.createProject;
  }

  return { pending: loading, create };
}
