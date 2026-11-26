"use client";

import { useSuspenseQuery } from "@apollo/client/react";
import { useLocale, useTranslations } from "next-intl";
import { MeDocument, UserDocument } from "@/shared/graphql";
import { getUserDisplayName } from "@/shared/utils";
import { canEditProfile, canVerifyEmail, formatMemberSince } from "../../utils";

/**
 * The data of the Profile tab: the employee's name, email and the day they joined, and whether the signed-in user may
 * edit it (`canEdit`: the owner or an Admin), whether VERIFY EMAIL shows (`canVerifyEmail`: the owner, not verified
 * yet), and the `user` itself for the form. It reads the same `me` and `user(id)` queries as the shell, with the same
 * options, so it gets the results that the route layout preloaded on the server (PLAN D6) and sends no request of its
 * own. The shell already turned a failed load into the 404 or the "Oops" page before
 * this tab renders, so a missing user here is a bug and is thrown.
 */
export function useUserProfile(userId: string) {
  const t = useTranslations("userDetails.profile");
  const locale = useLocale();
  const { data: meData } = useSuspenseQuery(MeDocument);
  const { data } = useSuspenseQuery(UserDocument, {
    variables: { id: userId },
    errorPolicy: "all",
  });
  const user = data?.user;
  if (!user) throw new Error("The user query returned no user");

  const memberSince = formatMemberSince(user.createdAt, locale);
  const name = getUserDisplayName(user);

  return {
    name,
    // A user without a name is already named by the email, so the email line would only repeat it.
    email: name === user.email ? null : user.email,
    // `user.id`, not the route's `userId`: the backend accepts a UUID in any letter case, but answers it lower case,
    // as `me.id` is.
    canEdit: canEditProfile(meData.me, user.id),
    canVerifyEmail: canVerifyEmail(meData.me, user.id),
    user,
    avatarUrl: user.avatarUrl ?? null,
    memberSince: memberSince === null ? null : t("memberSince", { date: memberSince }),
  };
}
