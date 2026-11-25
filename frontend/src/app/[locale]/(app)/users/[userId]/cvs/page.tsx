import { UserCvs } from "@/features/user-details";

// Reading the params is per request, so the page renders inside the one `<Suspense>` of the (app) layout, and a
// navigation to it waits instead of showing a loading state of its own (see `../layout.tsx`).
// https://nextjs.org/docs/messages/blocking-prerender-dynamic
export const instant = false;

export default async function UserCvsPage({ params }: PageProps<"/[locale]/users/[userId]/cvs">) {
  const { userId } = await params;

  return <UserCvs userId={userId} />;
}
