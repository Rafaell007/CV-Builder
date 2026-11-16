import { Suspense } from "react";
import { CvPreview } from "@/features/cvs";

// CvLayout (cvs/[cvId]/layout.tsx) shows a loading state until the backend returned the CV, so this page is not
// rendered during prerender and Next.js cannot check it for instant navigation. That is intended: the preview must
// not start its request before the CV is known. https://nextjs.org/docs/messages/instant-unrendered-segment
export const instant = false;

type CvPreviewParams = PageProps<"/[locale]/cvs/[cvId]/preview">["params"];

// Reading the params is runtime data: Next.js needs it inside Suspense, or the build fails while prerendering.
async function CvPreviewRoute({ params }: { params: CvPreviewParams }) {
  const { cvId } = await params;

  return <CvPreview cvId={cvId} />;
}

export default function CvPreviewPage({ params }: PageProps<"/[locale]/cvs/[cvId]/preview">) {
  return (
    <Suspense>
      <CvPreviewRoute params={params} />
    </Suspense>
  );
}
