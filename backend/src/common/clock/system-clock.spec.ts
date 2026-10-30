import { Test } from "@nestjs/testing";
import { Clock } from "./clock";
import { ClockModule } from "./clock.module";
import { SystemClock } from "./system-clock";

describe("Clock", () => {
  it("is provided by ClockModule as the system clock", async () => {
    const moduleRef = await Test.createTestingModule({ imports: [ClockModule] }).compile();

    expect(moduleRef.get(Clock)).toBeInstanceOf(SystemClock);
  });

  it("returns the current time", () => {
    const before = Date.now();
    const now = new SystemClock().now().getTime();

    expect(now).toBeGreaterThanOrEqual(before);
    expect(now).toBeLessThanOrEqual(Date.now());
  });

  it("can be replaced by a fixed time in tests", async () => {
    const fixed = new Date("2026-07-12T10:00:00.000Z");
    const moduleRef = await Test.createTestingModule({ imports: [ClockModule] })
      .overrideProvider(Clock)
      .useValue({ now: () => fixed })
      .compile();

    expect(moduleRef.get<Clock>(Clock).now()).toBe(fixed);
  });
});
