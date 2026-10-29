import { Test } from "@nestjs/testing";
import { PrismaService } from "./prisma/prisma.service";

describe("AppModule", () => {
  it("compiles", async () => {
    // Config validation runs when app.module is imported, so DATABASE_URL must exist before that.
    process.env["DATABASE_URL"] = "postgresql://user:password@localhost:5432/test";
    const { AppModule } = await import("./app.module");

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue({})
      .compile();

    expect(moduleRef.get(AppModule)).toBeInstanceOf(AppModule);
  });
});
