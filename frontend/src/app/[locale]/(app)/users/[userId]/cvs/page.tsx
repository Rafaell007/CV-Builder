import { Suspense } from "react";
import { UserCvs } from "@/features/user-details";

type UserCvsParams = PageProps<"/[locale]/users/[userId]/cvs">["params"];

// Only reads userId from the params and passes it on. Reading the params is runtime data: Next.js needs it inside Suspense, or the build fails while prerendering.
async function UserCvsWithUserId({ params }: { params: UserCvsParams }) {
  const { userId } = await params;

  return <UserCvs userId={userId} />;
}

export default function UserCvsPage({ params }: PageProps<"/[locale]/users/[userId]/cvs">) {
  return (
    <Suspense>
      <UserCvsWithUserId params={params} />
    </Suspense>
  );
}
