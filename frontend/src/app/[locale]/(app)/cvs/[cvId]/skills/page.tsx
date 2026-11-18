import { Suspense } from "react";
import { CvSkills } from "@/features/cvs";

// CvLayout (cvs/[cvId]/layout.tsx) shows a loading state until the backend returned the CV, so this page is not
// rendered during prerender and Next.js cannot check it for instant navigation. That is intended: the page must
// not start its requests before the CV is known. https://nextjs.org/docs/messages/instant-unrendered-segment
export const instant = false;

type CvSkillsParams = PageProps<"/[locale]/cvs/[cvId]/skills">["params"];

// Reading the params is runtime data: Next.js needs it inside Suspense, or the build fails while prerendering.
async function CvSkillsRoute({ params }: { params: CvSkillsParams }) {
  const { cvId } = await params;

  return <CvSkills cvId={cvId} />;
}

export default function CvSkillsPage({ params }: PageProps<"/[locale]/cvs/[cvId]/skills">) {
  return (
    <Suspense>
      <CvSkillsRoute params={params} />
    </Suspense>
  );
}
