import { CVS } from "./cvs.data";
import { PROJECTS } from "./projects.data";
import { USERS } from "./users.data";

// The seed throws on a wrong name only while it runs; these checks catch it earlier, without a database.
describe("seed data", () => {
  const userByEmail = new Map(USERS.map((user) => [user.email, user]));
  const projectByName = new Map(PROJECTS.map((project) => [project.name, project]));

  it.each(CVS.map((cv) => [`${cv.ownerEmail} / ${cv.name}`, cv] as const))(
    "CV %s belongs to a seeded user and uses only that user's skills",
    (_label, cv) => {
      const owner = userByEmail.get(cv.ownerEmail);
      expect(owner).toBeDefined();

      const ownedSkills = new Set(owner?.skills.map(([skill]) => skill));
      const foreignSkills = cv.skills.filter((skill) => !ownedSkills.has(skill));
      expect(foreignSkills).toEqual([]);
    },
  );

  it.each(CVS.map((cv) => [`${cv.ownerEmail} / ${cv.name}`, cv] as const))(
    "CV %s has an education and its projects stay inside the project dates",
    (_label, cv) => {
      expect(cv.education.trim()).not.toBe("");

      for (const cvProject of cv.projects) {
        const project = projectByName.get(cvProject.project);
        expect(project).toBeDefined();
        if (!project) continue;

        // ISO days compare correctly as strings.
        expect(cvProject.startDate >= project.startDate).toBe(true);
        expect(cvProject.startDate <= project.endDate).toBe(true);
        if (cvProject.endDate !== null) {
          expect(cvProject.endDate >= cvProject.startDate).toBe(true);
          expect(cvProject.endDate <= project.endDate).toBe(true);
        }
        expect(cvProject.roles.length).toBeGreaterThan(0);
      }
    },
  );
});
