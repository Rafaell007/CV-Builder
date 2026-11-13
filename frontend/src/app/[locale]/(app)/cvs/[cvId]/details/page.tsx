import { Suspense } from "react";
import { CvDetails } from "@/features/cvs";

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
