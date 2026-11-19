import { NotFoundException } from "@nestjs/common";
import type { AuthUser } from "../../../common/auth";
import type { Clock } from "../../../common/clock";
import { Mastery, Proficiency, Role } from "../../../generated/prisma/enums";
import type { PrismaService } from "../../../prisma/prisma.service";
import type { CvsService } from "../cvs.service";
import { CvPreviewService } from "./cv-preview.service";

const USER: AuthUser = { id: "user-1", role: Role.USER, isVerified: true };
const NOW = new Date("2026-11-13T10:00:00.000Z");

const prisma = {
  cv: { findUnique: jest.fn() },
  user: { findUnique: jest.fn() },
  cvSkill: { findMany: jest.fn() },
  cvProject: { findMany: jest.fn() },
};
const cvs = { assertAccessible: jest.fn() };
const clock: Clock = { now: () => NOW };

const service = new CvPreviewService(
  prisma as unknown as PrismaService,
  cvs as unknown as CvsService,
  clock,
);

function owner(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    firstName: "Anna",
    lastName: "Nowak",
    position: { name: "Developer" },
    userLanguages: [
      { proficiency: Proficiency.C1, language: { name: "English" } },
      { proficiency: Proficiency.NATIVE, language: { name: "Polish" } },
    ],
    ...overrides,
  };
}

function skillRow(id: string, name: string, category: string): Record<string, unknown> {
  return { mastery: Mastery.ADVANCED, skill: { id, name, category: { name: category } } };
}

function projectRow(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    startDate: new Date("2023-01-10T00:00:00.000Z"),
    endDate: new Date("2024-06-30T00:00:00.000Z"),
    responsibilities: "Built the UI",
    project: {
      name: "Shop",
      description: "A shop",
      domain: "Retail",
      skills: [{ skill: { id: "s-react", name: "React" } }],
    },
    roles: [{ role: { name: "Developer" } }],
    ...overrides,
  };
}

async function rejection(call: Promise<unknown>): Promise<unknown> {
  try {
    await call;
  } catch (error) {
    return error;
  }
  throw new Error("The call did not fail");
}

beforeEach(() => {
  jest.clearAllMocks();
  cvs.assertAccessible.mockResolvedValue({ ownerId: "owner-1" });
  prisma.cv.findUnique.mockResolvedValue({
    name: "Main CV",
    education: "MSc",
    description: "About",
  });
  prisma.user.findUnique.mockResolvedValue(owner());
  prisma.cvSkill.findMany.mockResolvedValue([]);
  prisma.cvProject.findMany.mockResolvedValue([]);
});

describe("CvPreviewService.get", () => {
  it("checks access first and loads nothing when the check refuses", async () => {
    cvs.assertAccessible.mockRejectedValue(new NotFoundException("CV not found"));

    const error = await rejection(service.get(USER, "cv-1"));

    expect(error).toBeInstanceOf(NotFoundException);
    expect(cvs.assertAccessible).toHaveBeenCalledWith(USER, "cv-1");
    expect(prisma.cv.findUnique).not.toHaveBeenCalled();
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
    expect(prisma.cvSkill.findMany).not.toHaveBeenCalled();
    expect(prisma.cvProject.findMany).not.toHaveBeenCalled();
  });

  it("loads only data of this CV and of its owner", async () => {
    await service.get(USER, "cv-1");

    expect(prisma.cv.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "cv-1" } }),
    );
    expect(prisma.user.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "owner-1" } }),
    );
    expect(prisma.cvSkill.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { cvId: "cv-1" } }),
    );
    expect(prisma.cvProject.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { cvId: "cv-1" },
        orderBy: [{ startDate: "desc" }, { id: "asc" }],
      }),
    );
  });

  it("returns the CV data, the owner name, the position and the languages", async () => {
    const preview = await service.get(USER, "cv-1");

    expect(preview).toMatchObject({
      cvId: "cv-1",
      name: "Main CV",
      education: "MSc",
      description: "About",
      fullName: "Anna Nowak",
      position: "Developer",
      languages: [
        { name: "English", proficiency: Proficiency.C1 },
        { name: "Polish", proficiency: Proficiency.NATIVE },
      ],
    });
  });

  it("gives null for the name and the position when the owner has none", async () => {
    prisma.user.findUnique.mockResolvedValue(
      owner({ firstName: null, lastName: null, position: null }),
    );

    const preview = await service.get(USER, "cv-1");

    expect(preview.fullName).toBeNull();
    expect(preview.position).toBeNull();
  });

  it("uses the one name that exists without extra spaces", async () => {
    prisma.user.findUnique.mockResolvedValue(owner({ firstName: "Anna", lastName: null }));
    expect((await service.get(USER, "cv-1")).fullName).toBe("Anna");

    prisma.user.findUnique.mockResolvedValue(owner({ firstName: null, lastName: "Nowak" }));
    expect((await service.get(USER, "cv-1")).fullName).toBe("Nowak");
  });

  it("groups skills by category and creates no empty groups", async () => {
    prisma.cvSkill.findMany.mockResolvedValue([
      skillRow("s-react", "React", "Frontend"),
      skillRow("s-vue", "Vue", "Frontend"),
      skillRow("s-nest", "NestJS", "Backend"),
    ]);

    const { skillGroups } = await service.get(USER, "cv-1");

    expect(skillGroups.map((group) => group.category)).toEqual(["Frontend", "Backend"]);
    expect(skillGroups[0]?.skills.map((skill) => skill.name)).toEqual(["React", "Vue"]);
    expect(skillGroups[1]?.skills.map((skill) => skill.name)).toEqual(["NestJS"]);
  });

  it("asks the database for skills sorted by category and name", async () => {
    await service.get(USER, "cv-1");

    expect(prisma.cvSkill.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: [
          { skill: { category: { name: "asc" } } },
          { skill: { name: "asc" } },
          { id: "asc" },
        ],
      }),
    );
  });

  it("calculates experience and last use from the projects of this CV only", async () => {
    prisma.cvSkill.findMany.mockResolvedValue([skillRow("s-react", "React", "Frontend")]);
    prisma.cvProject.findMany.mockResolvedValue([
      projectRow(),
      projectRow({
        startDate: new Date("2021-03-01T00:00:00.000Z"),
        endDate: new Date("2022-01-31T00:00:00.000Z"),
      }),
    ]);

    const { skillGroups } = await service.get(USER, "cv-1");

    // Earliest start 2021-03-01 to 2026-11-13 is 5 full years; the latest end is 2024.
    expect(skillGroups[0]?.skills[0]).toMatchObject({
      name: "React",
      experienceYears: 5,
      lastUsedYear: 2024,
    });
  });

  it("uses the year of now for a skill in a project that has no end date", async () => {
    prisma.cvSkill.findMany.mockResolvedValue([skillRow("s-react", "React", "Frontend")]);
    prisma.cvProject.findMany.mockResolvedValue([projectRow({ endDate: null })]);

    const { skillGroups } = await service.get(USER, "cv-1");

    expect(skillGroups[0]?.skills[0]?.lastUsedYear).toBe(2026);
  });

  it("gives null years for a skill that is in no project environment", async () => {
    prisma.cvSkill.findMany.mockResolvedValue([skillRow("s-go", "Go", "Backend")]);
    prisma.cvProject.findMany.mockResolvedValue([projectRow()]);

    const { skillGroups } = await service.get(USER, "cv-1");

    expect(skillGroups[0]?.skills[0]).toMatchObject({ experienceYears: null, lastUsedYear: null });
  });

  it("lists each domain once", async () => {
    const other = { ...(projectRow().project as object), name: "Shop 2" };
    prisma.cvProject.findMany.mockResolvedValue([
      projectRow(),
      projectRow({ project: other }),
      projectRow({ project: { ...other, domain: "Finance" } }),
    ]);

    const { domains } = await service.get(USER, "cv-1");

    expect(domains).toEqual(["Retail", "Finance"]);
  });

  it("builds the project with environment, roles, period and dates", async () => {
    prisma.cvProject.findMany.mockResolvedValue([projectRow()]);

    const { projects } = await service.get(USER, "cv-1");

    expect(projects).toEqual([
      {
        name: "Shop",
        description: "A shop",
        domain: "Retail",
        environment: ["React"],
        roles: ["Developer"],
        period: "01.2023 – 06.2024",
        startDate: new Date("2023-01-10T00:00:00.000Z"),
        endDate: new Date("2024-06-30T00:00:00.000Z"),
        responsibilities: "Built the UI",
      },
    ]);
  });

  it("gives an empty roles list, a null end date and null responsibilities when missing", async () => {
    prisma.cvProject.findMany.mockResolvedValue([
      projectRow({ roles: [], endDate: null, responsibilities: null }),
    ]);

    const { projects } = await service.get(USER, "cv-1");

    expect(projects[0]).toMatchObject({
      roles: [],
      endDate: null,
      responsibilities: null,
      period: "01.2023 – Till now",
    });
  });

  it("writes the open period in the language that was asked for", async () => {
    prisma.cvProject.findMany.mockResolvedValue([
      projectRow({ endDate: null }),
      projectRow({ startDate: new Date("2020-02-01T00:00:00.000Z") }),
    ]);

    const polish = await service.get(USER, "cv-1", "pl");
    const english = await service.get(USER, "cv-1", "en");

    expect(polish.projects.map((project) => project.period)).toEqual([
      "01.2023 – obecnie",
      "02.2020 – 06.2024",
    ]);
    expect(english.projects[0]?.period).toBe("01.2023 – Till now");
  });

  it("answers not found when the CV or the owner is gone after the check", async () => {
    prisma.cv.findUnique.mockResolvedValue(null);

    expect(await rejection(service.get(USER, "cv-1"))).toBeInstanceOf(NotFoundException);
  });
});
