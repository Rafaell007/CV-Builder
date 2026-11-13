import type { PreviewProject } from "./preview-project";

/** The domains of the CV projects, each one once, in the order they first appear. */
export function uniqueDomains(projects: PreviewProject[]): string[] {
  return [...new Set(projects.map((project) => project.domain))];
}
