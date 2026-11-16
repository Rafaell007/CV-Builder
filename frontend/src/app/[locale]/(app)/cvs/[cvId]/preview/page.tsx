import { Suspense } from "react";
import { CvPreview } from "@/features/cvs";

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
