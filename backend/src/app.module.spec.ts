import { Test } from "@nestjs/testing";
import { PrismaService } from "./prisma/prisma.service";

describe("AppModule", () => {
  it("compiles", async () => {
    // Config validation runs when app.module is imported, so the variables must exist before that.
    process.env["DATABASE_URL"] = "postgresql://user:password@localhost:5432/test";
    process.env["JWT_ACCESS_SECRET"] = "unit-test-access-secret-0123456789abc";
    process.env["JWT_REFRESH_SECRET"] = "unit-test-refresh-secret-0123456789ab";
    const { AppModule } = await import("./app.module.js");

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue({})
      .compile();

    expect(moduleRef.get(AppModule)).toBeInstanceOf(AppModule);
  });
});
