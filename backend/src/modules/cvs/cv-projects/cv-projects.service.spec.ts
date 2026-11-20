import { ConflictException, NotFoundException } from "@nestjs/common";
import type { AuthUser } from "../../../common/auth";
import { ValidationFailedException } from "../../../common/errors";
import { SortDirection } from "../../../common/pagination";
import { Prisma } from "../../../generated/prisma/client";
import { Role } from "../../../generated/prisma/enums";
import type { PrismaService } from "../../../prisma/prisma.service";
import { CvProjectsService } from "./cv-projects.service";
import type { CvsService } from "../cvs.service";
import type { AddCvProjectInput } from "./dto/add-cv-project.input";
import type { UpdateCvProjectInput } from "./dto/update-cv-project.input";

const USER: AuthUser = { id: "user-1", role: Role.USER, isVerified: true };
const ADMIN: AuthUser = { id: "admin-1", role: Role.ADMIN, isVerified: true };

const PROJECT_DATES = {
  startDate: new Date("2026-01-01T00:00:00Z"),
  endDate: new Date("2026-12-31T00:00:00Z"),
};

const transaction = jest.fn();
const prisma = {
  cvProject: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    deleteMany: jest.fn(),
  },
  project: { findUnique: jest.fn() },
  projectRole: { count: jest.fn() },
  $transaction: transaction,
};
// The work of a transaction runs against the same mock, as if it were the transaction client.
transaction.mockImplementation((work: (tx: unknown) => Promise<unknown>) => work(prisma));

const cvs = { assertAccessible: jest.fn() };

function storedEntry(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: "entry-1",
    cvId: "cv-1",
    projectId: "project-1",
    startDate: new Date("2026-03-01T00:00:00Z"),
    endDate: null,
    responsibilities: "Built the API",
    createdAt: new Date("2026-11-01T10:00:00.000Z"),
    updatedAt: new Date("2026-11-01T10:00:00.000Z"),
    project: {
      id: "project-1",
      name: "Bank App",
      domain: "Finance",
      description: "Text",
      createdAt: new Date("2026-10-01T10:00:00.000Z"),
      updatedAt: new Date("2026-10-01T10:00:00.000Z"),
      ...PROJECT_DATES,
      skills: [{ skill: { id: "skill-1", name: "TypeScript" } }],
    },
    roles: [{ role: { id: "role-1", name: "Developer" } }],
    ...overrides,
  };
}

function addInput(overrides: Partial<AddCvProjectInput> = {}): AddCvProjectInput {
  return {
    cvId: "cv-1",
    projectId: "project-1",
    startDate: new Date("2026-03-01T00:00:00Z"),
    roleIds: ["role-1"],
    ...overrides,
  };
}

function updateInput(overrides: Partial<UpdateCvProjectInput> = {}): UpdateCvProjectInput {
  return {
    id: "entry-1",
    startDate: new Date("2026-04-01T00:00:00Z"),
    roleIds: ["role-1", "role-2"],
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

function databaseError(code: string): Prisma.PrismaClientKnownRequestError {
  return new Prisma.PrismaClientKnownRequestError("database error", {
    code,
    clientVersion: "test",
  });
}

function firstCall<T>(mock: jest.Mock): T {
  return (mock.mock.calls[0] as [T])[0];
}

const service = new CvProjectsService(
  prisma as unknown as PrismaService,
  cvs as unknown as CvsService,
);

beforeEach(() => {
  jest.clearAllMocks();
  cvs.assertAccessible.mockResolvedValue(undefined);
  prisma.cvProject.findMany.mockResolvedValue([storedEntry()]);
  prisma.cvProject.findUnique.mockResolvedValue({
    cvId: "cv-1",
    project: PROJECT_DATES,
  });
  prisma.cvProject.create.mockResolvedValue(storedEntry());
  prisma.cvProject.update.mockResolvedValue(storedEntry());
  prisma.cvProject.deleteMany.mockResolvedValue({ count: 1 });
  prisma.project.findUnique.mockResolvedValue(PROJECT_DATES);
  // By default every requested role exists.
  prisma.projectRole.count.mockImplementation(({ where }: { where: { id: { in: string[] } } }) =>
    Promise.resolve(where.id.in.length),
  );
});

describe("CvProjectsService.list", () => {
  it("returns the entries with the project, the environment and the roles as plain lists", async () => {
    const [entry] = await service.list(USER, { cvId: "cv-1" });

    expect(entry).toMatchObject({
      id: "entry-1",
      cvId: "cv-1",
      endDate: null,
      project: { name: "Bank App", environment: [{ id: "skill-1", name: "TypeScript" }] },
      roles: [{ id: "role-1", name: "Developer" }],
    });
    expect(entry).not.toHaveProperty("project.skills");
  });

  it("checks the access to the CV first and reads nothing when it fails", async () => {
    cvs.assertAccessible.mockRejectedValue(new NotFoundException("CV not found"));

    expect(await rejection(service.list(USER, { cvId: "cv-2" }))).toBeInstanceOf(NotFoundException);
    expect(cvs.assertAccessible).toHaveBeenCalledWith(USER, "cv-2");
    expect(prisma.cvProject.findMany).not.toHaveBeenCalled();
  });

  it("lets an admin read the projects of the CV of another user", async () => {
    await service.list(ADMIN, { cvId: "cv-1" });

    expect(cvs.assertAccessible).toHaveBeenCalledWith(ADMIN, "cv-1");
    expect(prisma.cvProject.findMany).toHaveBeenCalled();
  });

  it("reads only the selected CV when no search is given", async () => {
    await service.list(USER, { cvId: "cv-1" });

    expect(firstCall<{ where: unknown }>(prisma.cvProject.findMany).where).toEqual({
      cvId: "cv-1",
    });
  });

  it("searches the name and the domain, case-insensitive, inside the selected CV", async () => {
    await service.list(USER, { cvId: "cv-1", search: "bank" });

    expect(firstCall<{ where: unknown }>(prisma.cvProject.findMany).where).toEqual({
      cvId: "cv-1",
      project: {
        OR: [
          { name: { contains: "bank", mode: "insensitive" } },
          { domain: { contains: "bank", mode: "insensitive" } },
        ],
      },
    });
  });

  it("sorts by the project name ascending by default, with the id as tie-breaker", async () => {
    await service.list(USER, { cvId: "cv-1" });

    expect(firstCall<{ orderBy: unknown }>(prisma.cvProject.findMany).orderBy).toEqual([
      { project: { name: "asc" } },
      { id: "asc" },
    ]);
  });

  it("sorts by the project name descending", async () => {
    await service.list(USER, {
      cvId: "cv-1",
      sort: { field: "name", direction: SortDirection.DESC },
    });

    expect(firstCall<{ orderBy: unknown }>(prisma.cvProject.findMany).orderBy).toEqual([
      { project: { name: "desc" } },
      { id: "asc" },
    ]);
  });

  it("sorts by the start date of the person", async () => {
    await service.list(USER, {
      cvId: "cv-1",
      sort: { field: "startDate", direction: SortDirection.DESC },
    });

    expect(firstCall<{ orderBy: unknown }>(prisma.cvProject.findMany).orderBy).toEqual([
      { startDate: "desc" },
      { id: "asc" },
    ]);
  });

  it("sorts Present (no end date) after the dates when ascending and before them when descending", async () => {
    await service.list(USER, {
      cvId: "cv-1",
      sort: { field: "endDate", direction: SortDirection.ASC },
    });
    await service.list(USER, {
      cvId: "cv-1",
      sort: { field: "endDate", direction: SortDirection.DESC },
    });

    const orders = prisma.cvProject.findMany.mock.calls.map(
      (call) => (call as [{ orderBy: unknown[] }])[0].orderBy[0],
    );
    expect(orders).toEqual([
      { endDate: { sort: "asc", nulls: "last" } },
      { endDate: { sort: "desc", nulls: "first" } },
    ]);
  });

  it("rejects a sort field that is not allowed", async () => {
    const error = await rejection(
      service.list(USER, {
        cvId: "cv-1",
        sort: { field: "responsibilities", direction: SortDirection.ASC },
      }),
    );

    expect(error).toBeInstanceOf(ValidationFailedException);
    expect(prisma.cvProject.findMany).not.toHaveBeenCalled();
  });
});

describe("CvProjectsService.add", () => {
  it("checks the access to the CV first and writes nothing when it fails", async () => {
    cvs.assertAccessible.mockRejectedValue(new NotFoundException("CV not found"));

    expect(await rejection(service.add(USER, addInput()))).toBeInstanceOf(NotFoundException);
    expect(prisma.cvProject.create).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("stores the dates, the responsibilities and the roles on the CV project", async () => {
    await service.add(
      USER,
      addInput({
        endDate: new Date("2026-06-30T12:00:00Z"),
        responsibilities: "Built the API",
        roleIds: ["role-1", "role-2"],
      }),
    );

    expect(firstCall<{ data: unknown }>(prisma.cvProject.create).data).toEqual({
      cvId: "cv-1",
      projectId: "project-1",
      startDate: new Date("2026-03-01T00:00:00Z"),
      endDate: new Date("2026-06-30T00:00:00Z"),
      responsibilities: "Built the API",
      roles: { create: [{ roleId: "role-1" }, { roleId: "role-2" }] },
    });
  });

  it("checks the access to the CV of the input, not to the project", async () => {
    await service.add(USER, addInput({ cvId: "cv-7", projectId: "project-9" }));

    expect(cvs.assertAccessible).toHaveBeenCalledWith(USER, "cv-7");
    expect(cvs.assertAccessible).not.toHaveBeenCalledWith(USER, "project-9");
  });

  it("reads the dates of the project with the project id, not the CV id", async () => {
    await service.add(USER, addInput({ cvId: "cv-7", projectId: "project-9" }));

    expect(prisma.project.findUnique).toHaveBeenCalledWith({
      where: { id: "project-9" },
      select: { startDate: true, endDate: true },
    });
  });

  it("returns the created entry", async () => {
    await expect(service.add(USER, addInput())).resolves.toMatchObject({
      id: "entry-1",
      project: { name: "Bank App" },
    });
  });

  it("stores Present as no end date and empty responsibilities as no value", async () => {
    await service.add(USER, addInput({ endDate: null, responsibilities: "" }));

    expect(firstCall<{ data: unknown }>(prisma.cvProject.create).data).toMatchObject({
      endDate: null,
      responsibilities: null,
    });
  });

  it("stores omitted responsibilities as no value", async () => {
    await service.add(USER, addInput());

    const { data } = firstCall<{ data: Record<string, unknown> }>(prisma.cvProject.create);
    expect(data).toHaveProperty("responsibilities", null);
  });

  it("runs in a serializable transaction", async () => {
    await service.add(USER, addInput());

    expect(prisma.$transaction).toHaveBeenCalledWith(expect.any(Function), {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    });
  });

  it("reports a field error when the project does not exist", async () => {
    prisma.project.findUnique.mockResolvedValue(null);

    await expect(service.add(USER, addInput())).rejects.toMatchObject({
      fieldErrors: [{ field: "projectId", messages: ["Project not found"] }],
    });
    expect(prisma.cvProject.create).not.toHaveBeenCalled();
  });

  it("reports a field error when a role does not exist", async () => {
    prisma.projectRole.count.mockResolvedValue(1);

    await expect(
      service.add(USER, addInput({ roleIds: ["role-1", "missing"] })),
    ).rejects.toMatchObject({
      fieldErrors: [{ field: "roleIds", messages: ["roleIds must contain only existing roles"] }],
    });
    expect(prisma.cvProject.create).not.toHaveBeenCalled();
  });

  it("checks the roles inside the transaction, not before it", async () => {
    const tx = { ...prisma, projectRole: { count: jest.fn().mockResolvedValue(1) } };
    transaction.mockImplementationOnce((work: (client: unknown) => Promise<unknown>) => work(tx));

    await service.add(USER, addInput());

    expect(tx.projectRole.count).toHaveBeenCalledTimes(1);
    expect(prisma.projectRole.count).not.toHaveBeenCalled();
  });

  it("rejects dates outside the project, using the dates stored in the catalog", async () => {
    await expect(
      service.add(USER, addInput({ startDate: new Date("2025-01-01T00:00:00Z") })),
    ).rejects.toMatchObject({
      fieldErrors: [
        { field: "startDate", messages: ["Start date must be within project duration"] },
      ],
    });
    expect(prisma.cvProject.create).not.toHaveBeenCalled();
  });

  it("answers CONFLICT when the project is already in the CV", async () => {
    prisma.cvProject.create.mockRejectedValue(databaseError("P2002"));

    const error = await rejection(service.add(USER, addInput()));

    expect(error).toBeInstanceOf(ConflictException);
    expect((error as ConflictException).message).toBe("The project is already in this CV");
  });

  it("answers CONFLICT when the database stops the transaction because of a parallel change", async () => {
    prisma.cvProject.create.mockRejectedValue(databaseError("P2034"));

    expect(await rejection(service.add(USER, addInput()))).toBeInstanceOf(ConflictException);
  });

  it("answers NOT_FOUND when the CV is deleted after the access check", async () => {
    prisma.cvProject.create.mockRejectedValue(databaseError("P2003"));

    expect(await rejection(service.add(USER, addInput()))).toBeInstanceOf(NotFoundException);
  });

  it("says why the parallel change and the deleted CV are refused", async () => {
    prisma.cvProject.create.mockRejectedValueOnce(databaseError("P2034"));
    await expect(service.add(USER, addInput())).rejects.toThrow(
      "The CV was changed at the same time. Try again",
    );

    prisma.cvProject.create.mockRejectedValueOnce(databaseError("P2003"));
    await expect(service.add(USER, addInput())).rejects.toThrow("CV not found");
  });

  it("passes on other database errors", async () => {
    const failure = new Error("connection lost");
    prisma.cvProject.create.mockRejectedValue(failure);

    expect(await rejection(service.add(USER, addInput()))).toBe(failure);
  });

  it("passes on a database error with an unknown code without changing it", async () => {
    const failure = databaseError("P2999");
    prisma.cvProject.create.mockRejectedValue(failure);

    expect(await rejection(service.add(USER, addInput()))).toBe(failure);
  });
});

describe("CvProjectsService.update", () => {
  it("checks the access to the CV of the entry and writes nothing when it fails", async () => {
    cvs.assertAccessible.mockRejectedValue(new NotFoundException("CV not found"));

    expect(await rejection(service.update(USER, updateInput()))).toBeInstanceOf(NotFoundException);
    expect(cvs.assertAccessible).toHaveBeenCalledWith(USER, "cv-1");
    expect(prisma.cvProject.update).not.toHaveBeenCalled();
  });

  it("looks up the CV of the entry with the id of the input", async () => {
    await service.update(USER, updateInput());

    expect(prisma.cvProject.findUnique.mock.calls[0]).toEqual([
      { where: { id: "entry-1" }, select: { cvId: true } },
    ]);
  });

  it("answers NOT_FOUND for an entry that does not exist", async () => {
    prisma.cvProject.findUnique.mockResolvedValue(null);

    expect(await rejection(service.update(USER, updateInput()))).toBeInstanceOf(NotFoundException);
    expect(cvs.assertAccessible).not.toHaveBeenCalled();
  });

  it("replaces the dates, the responsibilities and all roles, and never the project", async () => {
    await service.update(
      USER,
      updateInput({ endDate: new Date("2026-09-01T00:00:00Z"), responsibilities: "Led the team" }),
    );

    const call = firstCall<{ where: unknown; data: Record<string, unknown> }>(
      prisma.cvProject.update,
    );
    expect(call.where).toEqual({ id: "entry-1" });
    expect(call.data).toEqual({
      startDate: new Date("2026-04-01T00:00:00Z"),
      endDate: new Date("2026-09-01T00:00:00Z"),
      responsibilities: "Led the team",
      roles: { deleteMany: {}, create: [{ roleId: "role-1" }, { roleId: "role-2" }] },
    });
    expect(call.data).not.toHaveProperty("projectId");
    expect(call.data).not.toHaveProperty("project");
  });

  it("clears the end date and the responsibilities when the input sends none", async () => {
    await service.update(USER, updateInput({ endDate: null, responsibilities: null }));

    expect(firstCall<{ data: unknown }>(prisma.cvProject.update).data).toMatchObject({
      endDate: null,
      responsibilities: null,
    });
  });

  it("stores empty responsibilities as no value", async () => {
    await service.update(USER, updateInput({ responsibilities: "" }));

    expect(firstCall<{ data: unknown }>(prisma.cvProject.update).data).toMatchObject({
      responsibilities: null,
    });
  });

  it("stores omitted responsibilities as no value, not as unchanged", async () => {
    await service.update(USER, updateInput());

    const { data } = firstCall<{ data: Record<string, unknown> }>(prisma.cvProject.update);
    expect(data).toHaveProperty("responsibilities", null);
  });

  it("rejects dates outside the project", async () => {
    await expect(
      service.update(USER, updateInput({ endDate: new Date("2027-02-01T00:00:00Z") })),
    ).rejects.toMatchObject({
      fieldErrors: [{ field: "endDate", messages: ["End date must be within project duration"] }],
    });
    expect(prisma.cvProject.update).not.toHaveBeenCalled();
  });

  it("rejects a role that does not exist", async () => {
    prisma.projectRole.count.mockResolvedValue(1);

    await expect(service.update(USER, updateInput())).rejects.toMatchObject({
      fieldErrors: [{ field: "roleIds", messages: ["roleIds must contain only existing roles"] }],
    });
    expect(prisma.cvProject.update).not.toHaveBeenCalled();
  });

  it("checks the roles inside the transaction, not before it", async () => {
    const tx = { ...prisma, projectRole: { count: jest.fn().mockResolvedValue(2) } };
    transaction.mockImplementationOnce((work: (client: unknown) => Promise<unknown>) => work(tx));

    await service.update(USER, updateInput());

    expect(tx.projectRole.count).toHaveBeenCalledTimes(1);
    expect(prisma.projectRole.count).not.toHaveBeenCalled();
  });

  it("answers NOT_FOUND when the entry is removed after the access check", async () => {
    prisma.cvProject.update.mockRejectedValue(databaseError("P2025"));

    expect(await rejection(service.update(USER, updateInput()))).toBeInstanceOf(NotFoundException);
  });

  it("says CV project not found when the entry does not exist or is removed", async () => {
    prisma.cvProject.findUnique.mockResolvedValueOnce(null);
    await expect(service.update(USER, updateInput())).rejects.toThrow("CV project not found");

    prisma.cvProject.update.mockRejectedValueOnce(databaseError("P2025"));
    await expect(service.update(USER, updateInput())).rejects.toThrow("CV project not found");
  });

  it("answers CONFLICT when the database stops the transaction because of a parallel change", async () => {
    prisma.cvProject.update.mockRejectedValue(databaseError("P2034"));

    expect(await rejection(service.update(USER, updateInput()))).toBeInstanceOf(ConflictException);
  });
});

describe("CvProjectsService.remove", () => {
  const input = { cvId: "cv-1", ids: ["entry-1", "entry-2"] };

  beforeEach(() => {
    prisma.cvProject.deleteMany.mockResolvedValue({ count: 2 });
  });

  it("checks the access to the CV first and deletes nothing when it fails", async () => {
    cvs.assertAccessible.mockRejectedValue(new NotFoundException("CV not found"));

    expect(await rejection(service.remove(USER, input))).toBeInstanceOf(NotFoundException);
    expect(prisma.cvProject.deleteMany).not.toHaveBeenCalled();
  });

  it("checks the access to the CV that is named in the input", async () => {
    await service.remove(USER, input);

    expect(cvs.assertAccessible).toHaveBeenCalledWith(USER, "cv-1");
  });

  it("deletes only the entries of the named CV", async () => {
    await service.remove(USER, input);

    expect(prisma.cvProject.deleteMany).toHaveBeenCalledWith({
      where: { id: { in: ["entry-1", "entry-2"] }, cvId: "cv-1" },
    });
  });

  it("never touches the catalog of projects or roles", async () => {
    await service.remove(USER, input);

    expect(prisma.project.findUnique).not.toHaveBeenCalled();
    expect(prisma.projectRole.count).not.toHaveBeenCalled();
  });

  it("answers NOT_FOUND when an id is not in this CV, so the transaction deletes nothing", async () => {
    prisma.cvProject.deleteMany.mockResolvedValue({ count: 1 });

    expect(await rejection(service.remove(USER, input))).toBeInstanceOf(NotFoundException);
  });
});
