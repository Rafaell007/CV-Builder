import { connection } from "next/server";
import { Suspense, type ReactNode } from "react";
import { UserLayout } from "@/features/user-details";
import { PreloadQuery } from "@/shared/apollo/server";
import { MeDocument, UserDocument } from "@/shared/graphql";

type UserRouteParams = LayoutProps<"/[locale]/users/[userId]">["params"];

// Starts the requests for the signed-in user (the role decides the CVs tab) and for this user (the name in the
// breadcrumbs) on the server, per request (PLAN D6). `UserLayout` reads both with `useSuspenseQuery`, so the first
// HTML already has them and the browser sends no second request.
async function UserLayoutWithUserId({
  params,
  children,
}: {
  params: UserRouteParams;
  children: ReactNode;
}) {
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

// The shell of every tab of a user (PLAN S6.2): header, breadcrumbs and tabs. Reading the params and the data is
// per request: Next.js needs it inside Suspense, or the build fails while prerendering.
export default function UserRouteLayout({
  children,
  params,
}: LayoutProps<"/[locale]/users/[userId]">) {
  return (
    <Suspense>
      <UserLayoutWithUserId params={params}>{children}</UserLayoutWithUserId>
    </Suspense>
  );
}
