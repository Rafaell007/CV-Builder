import { Suspense } from "react";
import { CvProjects } from "@/features/cvs";

type CvProjectsParams = PageProps<"/[locale]/cvs/[cvId]/projects">["params"];

// Reading the params is runtime data: Next.js needs it inside Suspense, or the build fails while prerendering.
async function CvProjectsRoute({ params }: { params: CvProjectsParams }) {
  const { cvId } = await params;

  return <CvProjects cvId={cvId} />;
}

export default function CvProjectsPage({ params }: PageProps<"/[locale]/cvs/[cvId]/projects">) {
  return (
    <Suspense>
      <CvProjectsRoute params={params} />
    </Suspense>
  );
}
