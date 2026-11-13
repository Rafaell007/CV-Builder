import { CvLayout } from "@/features/cvs";

// The shell of every tab of a CV (PLAN S7.2): it loads the CV and shows the tab page only when the backend allows it.
export default async function CvRouteLayout({
  children,
  params,
}: LayoutProps<"/[locale]/cvs/[cvId]">) {
  const { cvId } = await params;

  return <CvLayout cvId={cvId}>{children}</CvLayout>;
}
