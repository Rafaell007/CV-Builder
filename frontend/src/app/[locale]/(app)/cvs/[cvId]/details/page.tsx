import { CvDetails } from "@/features/cvs";

export default async function CvDetailsPage({ params }: PageProps<"/[locale]/cvs/[cvId]/details">) {
  const { cvId } = await params;

  return <CvDetails cvId={cvId} />;
}
