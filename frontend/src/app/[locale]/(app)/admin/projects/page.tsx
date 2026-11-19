import { Projects } from "@/features/projects";

// RequireAdmin (admin/layout.tsx) shows a loading state until the user is known, so this page is not rendered
// during prerender and Next.js cannot check it for instant navigation. That is intended: the page must not
// start its requests before the role is known. https://nextjs.org/docs/messages/instant-unrendered-segment
export const instant = false;

export default function AdminProjectsPage() {
  return <Projects />;
}
