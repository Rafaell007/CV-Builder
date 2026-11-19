import { Suspense, type ReactNode } from "react";
import { UserLayout } from "@/features/user-details";

type UserRouteParams = LayoutProps<"/[locale]/users/[userId]">["params"];

// Only reads userId from the params and passes it on. Reading the params is runtime data: Next.js needs it inside Suspense, or the build fails while prerendering.
async function UserLayoutWithUserId({
  params,
  children,
}: {
  params: UserRouteParams;
  children: ReactNode;
}) {
  const { userId } = await params;

  return <UserLayout userId={userId}>{children}</UserLayout>;
}

// The shell of every tab of a user (PLAN S7.7, until S6.2 builds the full User Details page): header and tabs.
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
