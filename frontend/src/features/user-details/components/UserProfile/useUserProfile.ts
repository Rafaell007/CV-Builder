"use client";

import { useSuspenseQuery } from "@apollo/client/react";
import { useLocale, useTranslations } from "next-intl";
import { UserDocument } from "@/shared/graphql";
import { getUserDisplayName } from "@/shared/utils";
import { formatMemberSince } from "../../utils";

/**
 * The data of the Profile tab: the employee's name, email and the day they joined. It reads the same `user(id)` query
 * as the shell, with the same options, so it gets the result that the route layout preloaded on the server (PLAN D6)
 * and sends no request of its own. The shell already turned a failed load into the 404 or the "Oops" page before
 * this tab renders, so a missing user here is a bug and is thrown.
 */
export function useUserProfile(userId: string) {
  const t = useTranslations("userDetails.profile");
  const locale = useLocale();
  const { data } = useSuspenseQuery(UserDocument, {
    variables: { id: userId },
    errorPolicy: "all",
  });
  const user = data?.user;
  if (!user) throw new Error("The user query returned no user");

  const memberSince = formatMemberSince(user.createdAt, locale);

  return {
    name: getUserDisplayName(user),
    email: user.email,
    memberSince: memberSince === null ? null : t("memberSince", { date: memberSince }),
  };
}
