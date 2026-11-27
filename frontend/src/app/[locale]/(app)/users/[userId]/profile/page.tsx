import { connection } from "next/server";
import { UserProfile } from "@/features/user-details";
import { PreloadQuery } from "@/shared/apollo/server";
import { DepartmentOptionsDocument, PositionOptionsDocument } from "@/shared/graphql";

// The Profile tab (PLAN S6.3). The user itself is preloaded by `../layout.tsx`; this page also starts the Department
// and Position options of the form on the server, per request (PLAN D6), for every viewer: the lists are small, and
// the server does not need to know who may edit. The form reads them with `useSuspenseDepartmentOptions` /
// `useSuspensePositionOptions`, so the browser sends no request of its own.
// The page renders inside the one `<Suspense>` of the (app) layout, which per-request work needs, and a navigation
// to it waits instead of showing a loading state of its own (see `../layout.tsx`).
// https://nextjs.org/docs/messages/blocking-prerender-dynamic
export const instant = false;

export default async function UserProfilePage({
  params,
}: PageProps<"/[locale]/users/[userId]/profile">) {
  await connection();
  const { userId } = await params;

  return (
    <PreloadQuery query={DepartmentOptionsDocument}>
      <PreloadQuery query={PositionOptionsDocument}>
        <UserProfile userId={userId} />
      </PreloadQuery>
    </PreloadQuery>
  );
}
