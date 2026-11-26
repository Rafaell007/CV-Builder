import { connection } from "next/server";
import { UserLayout } from "@/features/user-details";
import { PreloadQuery } from "@/shared/apollo/server";
import { MeDocument, UserDocument } from "@/shared/graphql";

// A navigation to a user waits for the data (the signed-in user and this user) and keeps the old page meanwhile,
// instead of showing a loading state of its own (see the (app) layout). A layout's value does not cover its pages, so
// the tab pages that wait for data declare it too. https://nextjs.org/docs/messages/blocking-prerender-dynamic
export const instant = false;

// The shell of every tab of a user (PLAN S6.2): header, breadcrumbs and tabs. It starts the requests for the signed-in
// user (the role decides the CVs tab) and for this user (the name in the breadcrumbs) on the server, per request
// (PLAN D6). `UserLayout` reads both with `useSuspenseQuery`, so the first HTML already has them and the browser sends
// no second request. It renders inside the one `<Suspense>` of the (app) layout, which per-request work needs.
export default async function UserRouteLayout({
  children,
  params,
}: LayoutProps<"/[locale]/users/[userId]">) {
  await connection();
  const { userId } = await params;

  return (
    <PreloadQuery query={MeDocument}>
      <PreloadQuery query={UserDocument} variables={{ id: userId }}>
        <UserLayout userId={userId}>{children}</UserLayout>
      </PreloadQuery>
    </PreloadQuery>
  );
}
