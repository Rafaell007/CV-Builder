import { Suspense } from "react";
import { CvDetails } from "@/features/cvs";

// CvLayout (cvs/[cvId]/layout.tsx) shows a loading state until the backend returned the CV, so this page is not
// rendered during prerender and Next.js cannot check it for instant navigation. That is intended: the page must
// not start its requests before the CV is known. https://nextjs.org/docs/messages/instant-unrendered-segment
export const instant = false;

type CvDetailsParams = PageProps<"/[locale]/cvs/[cvId]/details">["params"];

// Reading the params is runtime data: Next.js needs it inside Suspense, or the build fails while prerendering.
async function CvDetailsRoute({ params }: { params: CvDetailsParams }) {
  const { cvId } = await params;

  return <CvDetails cvId={cvId} />;
}

export default function CvDetailsPage({ params }: PageProps<"/[locale]/cvs/[cvId]/details">) {
  return (
    <Suspense>
      <CvDetailsRoute params={params} />
    </Suspense>
  );
}
