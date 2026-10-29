import { Test } from "@nestjs/testing";
import { AppModule } from "./app.module";
import { PrismaService } from "./prisma/prisma.service";

describe("AppModule", () => {
  it("compiles", async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue({})
      .compile();

    expect(moduleRef.get(AppModule)).toBeInstanceOf(AppModule);
  });
});
