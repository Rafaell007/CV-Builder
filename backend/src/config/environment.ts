import { Type } from "class-transformer";
import { IsIn, IsInt, IsOptional, IsString, IsUrl, Max, MinLength, Min } from "class-validator";

/** Every environment variable the backend reads. New variables go here, in `.env.example` and in PLAN.md §10. */
export class Environment {
  @IsIn(["development", "test", "production"])
  NODE_ENV = "development";

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

  // 32 characters or more, so the signing keys cannot be guessed (D9).
  @IsString()
  @MinLength(32)
  JWT_ACCESS_SECRET!: string;

  @IsString()
  @MinLength(32)
  JWT_REFRESH_SECRET!: string;

  // Absolute links in emails. The default is the local frontend.
  @IsUrl({ require_protocol: true, require_tld: false })
  FRONTEND_URL = "http://localhost:3000";

  // Mail. The defaults point at Mailpit from docker-compose.yml, which needs no login.
  @IsString()
  @MinLength(1)
  SMTP_HOST = "localhost";

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(65535)
  SMTP_PORT = 1025;

  @IsOptional()
  @IsString()
  SMTP_USER?: string;

  @IsOptional()
  @IsString()
  SMTP_PASS?: string;

  @IsString()
  @MinLength(1)
  MAIL_FROM = "CV Builder <no-reply@cv-builder.local>";
}
