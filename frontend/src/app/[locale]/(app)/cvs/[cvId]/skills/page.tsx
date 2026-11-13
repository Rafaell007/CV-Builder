import { Suspense } from "react";
import { CvSkills } from "@/features/cvs";

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
