import { Type } from "class-transformer";
import { IsInt, IsUrl, Max, Min } from "class-validator";

/** Every environment variable the backend reads. New variables go here, in `.env.example` and in PLAN.md §10. */
export class Environment {
  @Type(() => Number) // env values arrive as strings
  @IsInt()
  @Min(1)
  @Max(65535)
  PORT = 4000;

  // require_tld: false, because hosts like `localhost` have no top-level domain
  @IsUrl(
    { protocols: ["postgresql", "postgres"], require_protocol: true, require_tld: false },
    {
      message:
        "must be a PostgreSQL connection string, e.g. postgresql://user:password@localhost:5432/db",
    },
  )
  DATABASE_URL!: string;
}
