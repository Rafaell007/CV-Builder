import "reflect-metadata";
import { plainToInstance } from "class-transformer";
import { validateSync } from "class-validator";
import { Environment } from "./environment";

/** Fail fast: throws one readable error listing every invalid variable, so the app never starts misconfigured. */
export function validateEnvironment(raw: Record<string, unknown>): Environment {
  const environment = plainToInstance(Environment, raw, {
    enableImplicitConversion: true,
    exposeUnsetFields: false, // keep the class defaults (e.g. PORT = 4000) for variables that are not set
  });
  const errors = validateSync(environment, { skipMissingProperties: false });

  if (errors.length > 0) {
    const details = errors.map(
      (error) => `${error.property}: ${Object.values(error.constraints ?? {}).join(", ")}`,
    );
    throw new Error(`Invalid environment variables:\n${details.join("\n")}`);
  }

  return environment;
}
