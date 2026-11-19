import { Injectable, NotFoundException } from "@nestjs/common";
import type { AuthUser } from "../../../common/auth";
import { Clock } from "../../../common/clock";
import { Prisma } from "../../../generated/prisma/client";
import { PrismaService } from "../../../prisma/prisma.service";
import { OPEN_PERIOD_WORDS } from "../cv-locale";
import type { CvLocale } from "../cv-locale";
import { CvsService } from "../cvs.service";
import { experienceYears, formatPeriod, lastUsedYear, uniqueDomains } from "./calculations";
import type { PreviewProject } from "./calculations";
import type { CvPreview } from "./models/cv-preview";
import type { CvPreviewLanguage } from "./models/cv-preview-language";
import type { CvPreviewProject } from "./models/cv-preview-project";
import type { CvPreviewSkillGroup } from "./models/cv-preview-skill-group";

const OWNER_SELECT = {
  firstName: true,
  lastName: true,
  position: { select: { name: true } },
  userLanguages: {
    select: { proficiency: true, language: { select: { name: true } } },
    orderBy: [{ language: { name: "asc" } }, { id: "asc" }],
  },
} satisfies Prisma.UserSelect;

const CV_SKILL_SELECT = {
  mastery: true,
  skill: { select: { id: true, name: true, category: { select: { name: true } } } },
} satisfies Prisma.CvSkillSelect;

const CV_PROJECT_SELECT = {
  startDate: true,
  endDate: true,
  responsibilities: true,
  project: {
    select: {
      name: true,
      description: true,
      domain: true,
      skills: {
        select: { skill: { select: { id: true, name: true } } },
        orderBy: [{ skill: { name: "asc" } }, { skillId: "asc" }],
      },
    },
  },
  roles: {
    select: { role: { select: { name: true } } },
    orderBy: [{ role: { name: "asc" } }, { roleId: "asc" }],
  },
} satisfies Prisma.CvProjectSelect;

type OwnerRow = Prisma.UserGetPayload<{ select: typeof OWNER_SELECT }>;
type CvSkillRow = Prisma.CvSkillGetPayload<{ select: typeof CV_SKILL_SELECT }>;
type CvProjectRow = Prisma.CvProjectGetPayload<{ select: typeof CV_PROJECT_SELECT }>;

/**
 * Everything the CV preview page shows, built in one call (CV preview page). The CV decides who
 * may read it: the owner and admins, with the same rule as the CV itself
 * (`CvsService.assertAccessible`). Only data of this CV and of its owner is loaded.
 */
@Injectable()
export class CvPreviewService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cvs: CvsService,
    private readonly clock: Clock,
  ) {}

  async get(user: AuthUser, cvId: string, locale: CvLocale): Promise<CvPreview> {
    // Nothing is loaded before this check passes.
    const { ownerId } = await this.cvs.assertAccessible(user, cvId);

    const [cv, owner, skillRows, projectRows] = await Promise.all([
      this.prisma.cv.findUnique({
        where: { id: cvId },
        select: { name: true, education: true, description: true },
      }),
      this.prisma.user.findUnique({ where: { id: ownerId }, select: OWNER_SELECT }),
      this.prisma.cvSkill.findMany({
        where: { cvId },
        select: CV_SKILL_SELECT,
        orderBy: [
          { skill: { category: { name: "asc" } } },
          { skill: { name: "asc" } },
          { id: "asc" },
        ],
      }),
      this.prisma.cvProject.findMany({
        where: { cvId },
        select: CV_PROJECT_SELECT,
        orderBy: [{ startDate: "desc" }, { id: "asc" }],
      }),
    ]);
    // The CV or the owner was deleted after the access check.
    if (cv === null || owner === null) throw new NotFoundException("CV not found");

    const now = this.clock.now();
    // The experience of a skill counts only the projects of this CV, matched on the skill id.
    const previewProjects = projectRows.map(toPreviewProject);

    return {
      cvId,
      ...cv,
      fullName: toFullName(owner),
      position: owner.position?.name ?? null,
      languages: toLanguages(owner),
      domains: uniqueDomains(previewProjects),
      skillGroups: toSkillGroups(skillRows, previewProjects, now),
      projects: projectRows.map((row) => toProject(row, locale)),
    };
  }
}

function toFullName({ firstName, lastName }: OwnerRow): string | null {
  const parts = [firstName, lastName].filter(
    (part): part is string => part !== null && part !== "",
  );
  return parts.length === 0 ? null : parts.join(" ");
}

function toLanguages({ userLanguages }: OwnerRow): CvPreviewLanguage[] {
  return userLanguages.map(({ language, proficiency }) => ({ name: language.name, proficiency }));
}

/** The rows come sorted by category and skill name, so a group is a run of equal category names. */
function toSkillGroups(
  rows: CvSkillRow[],
  projects: PreviewProject[],
  now: Date,
): CvPreviewSkillGroup[] {
  const groups: CvPreviewSkillGroup[] = [];
  for (const { skill, mastery } of rows) {
    const skillView = {
      name: skill.name,
      mastery,
      experienceYears: experienceYears(skill.id, projects, now),
      lastUsedYear: lastUsedYear(skill.id, projects, now),
    };
    const last = groups.at(-1);
    if (last !== undefined && last.category === skill.category.name) {
      last.skills.push(skillView);
    } else {
      groups.push({ category: skill.category.name, skills: [skillView] });
    }
  }
  return groups;
}

function toPreviewProject(row: CvProjectRow): PreviewProject {
  return {
    skillIds: row.project.skills.map(({ skill }) => skill.id),
    domain: row.project.domain,
    startDate: row.startDate,
    endDate: row.endDate,
  };
}

function toProject(row: CvProjectRow, locale: CvLocale): CvPreviewProject {
  const { project } = row;
  return {
    name: project.name,
    description: project.description,
    domain: project.domain,
    environment: project.skills.map(({ skill }) => skill.name),
    roles: row.roles.map(({ role }) => role.name),
    period: formatPeriod(row.startDate, row.endDate, OPEN_PERIOD_WORDS[locale]),
    startDate: row.startDate,
    endDate: row.endDate,
    responsibilities: row.responsibilities,
  };
}
