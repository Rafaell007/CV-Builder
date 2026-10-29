import { Type } from "class-transformer";
import { IsInt, Max, Min } from "class-validator";

/** Every environment variable the backend reads. New variables go here, in `.env.example` and in PLAN.md §10. */
export class Environment {
  @Type(() => Number) // env values arrive as strings
  @IsInt()
  @Min(1)
  @Max(65535)
  PORT = 4000;
}
