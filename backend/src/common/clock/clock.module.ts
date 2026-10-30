import { Global, Module } from "@nestjs/common";
import { Clock } from "./clock";
import { SystemClock } from "./system-clock";

/** Global, so any service can inject `Clock` without importing this module. */
@Global()
@Module({
  providers: [{ provide: Clock, useClass: SystemClock }],
  exports: [Clock],
})
export class ClockModule {}
