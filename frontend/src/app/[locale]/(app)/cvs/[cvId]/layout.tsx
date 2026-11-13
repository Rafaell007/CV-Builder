import { Suspense, type ReactNode } from "react";
import { CvLayout } from "@/features/cvs";

type CvRouteParams = LayoutProps<"/[locale]/cvs/[cvId]">["params"];

// Reading the params is runtime data: Next.js needs it inside Suspense, or the build fails while prerendering.
async function CvShell({ params, children }: { params: CvRouteParams; children: ReactNode }) {
  const { cvId } = await params;

  return <CvLayout cvId={cvId}>{children}</CvLayout>;
}

// The shell of every tab of a CV (PLAN S7.2): it loads the CV and shows the tab page only when the backend allows it.
export default function CvRouteLayout({ children, params }: LayoutProps<"/[locale]/cvs/[cvId]">) {
  return (
    <Suspense>
      <CvShell params={params}>{children}</CvShell>
    </Suspense>
  );
}
