import { Test } from "@nestjs/testing";
import { HealthResolver } from "./health.resolver";
import { HealthService } from "./health.service";

describe("HealthResolver", () => {
  it("reports status ok", async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [HealthResolver, HealthService],
    }).compile();

    expect(moduleRef.get(HealthResolver).health()).toEqual({ status: "ok" });
  });
});
