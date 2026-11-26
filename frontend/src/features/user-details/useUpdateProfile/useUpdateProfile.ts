"use client";

import { useMutation } from "@apollo/client/react";
import {
  UpdateProfileDocument,
  type UpdateProfileInput,
  type UpdateProfileMutation,
} from "@/shared/graphql";

export type SavedProfile = UpdateProfileMutation["updateProfile"];

export type UseUpdateProfileResult = {
  /** True while the request runs. */
  pending: boolean;
  /** Sends `updateProfile`. Resolves with the saved user. Rejects with the request's error, so the form can show it and keep its values. */
  update: (input: UpdateProfileInput) => Promise<SavedProfile>;
};

/**
 * The `updateProfile` request of the Profile tab. The answer has the `User` fields, so Apollo replaces the cached user
 * and the header, breadcrumbs and form show the new values without a new request. Two other places keep the old names:
 * - the stored Users lists: removed, so the Users page asks the backend again when opened (a new name can move the
 *   user to another place in the sorted list);
 * - the signed-in user (`me`, type `SessionUser`, shown in the sidebar) when someone saves their own profile: Apollo
 *   stores it under another type name, so its names are set here.
 */
export function useUpdateProfile(): UseUpdateProfileResult {
  const [updateProfile, { loading }] = useMutation(UpdateProfileDocument);

  async function update(input: UpdateProfileInput): Promise<SavedProfile> {
    const { data } = await updateProfile({
      variables: { input },
      update: (cache, { data: result }) => {
        cache.evict({ id: "ROOT_QUERY", fieldName: "users" });
        if (!result) return;
        const saved = result.updateProfile;
        // The signed-in user's own profile: `me` shows the new names too. When an Admin saves someone else's profile,
        // there is no `SessionUser` entry with this id, and `modify` changes nothing.
        const me = cache.identify({ __typename: "SessionUser", id: saved.id });
        // Only narrows the type: with a typename and an id, `identify` always returns a key (entry or not).
        if (me === undefined) return;
        cache.modify({
          id: me,
          fields: {
            firstName: () => saved.firstName,
            lastName: () => saved.lastName,
          },
        });
      },
    });
    // `useMutation` rejects on an error, so a missing result is not expected; fail loudly if it ever happens.
    if (!data) throw new Error("updateProfile returned no user");
    return data.updateProfile;
  }

  return { pending: loading, update };
}
