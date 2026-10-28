import { ConfigService } from "@nestjs/config";
import { Test } from "@nestjs/testing";
import { PrismaService } from "./prisma.service";

describe("PrismaService", () => {
  const createService = async (url?: string): Promise<PrismaService> => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        PrismaService,
        {
          provide: ConfigService,
          useValue: { getOrThrow: () => url ?? "postgresql://u:p@localhost:5432/db" },
        },
      ],
    }).compile();

    return moduleRef.get(PrismaService);
  };

  it("builds a Prisma client on the pg driver adapter", async () => {
    const service = await createService();

    expect(typeof service.$connect).toBe("function");
    expect(typeof service.$queryRaw).toBe("function");
  });

  it("fails when DATABASE_URL is missing", async () => {
    const config = {
      getOrThrow: () => {
        throw new Error("DATABASE_URL does not exist");
      },
    };

    await expect(
      Test.createTestingModule({
        providers: [PrismaService, { provide: ConfigService, useValue: config }],
      }).compile(),
    ).rejects.toThrow("DATABASE_URL");
  });
});
