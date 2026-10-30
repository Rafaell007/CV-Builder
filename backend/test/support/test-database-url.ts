const DEFAULT_TEST_DATABASE_URL =
  "postgresql://cv_builder:cv_builder@localhost:5432/cv_builder_test";

/**
 * The connection string of the database integration tests run against.
 * The name must end in `_test`: tests truncate every table, so they must never touch development data.
 */
export function getTestDatabaseUrl(): string {
  const url = process.env["TEST_DATABASE_URL"] ?? DEFAULT_TEST_DATABASE_URL;
  const databaseName = new URL(url).pathname.slice(1);

  if (!/^[a-z0-9_]+_test$/.test(databaseName)) {
    throw new Error(
      `Refusing to run integration tests against "${databaseName}": the test database name must end in "_test".`,
    );
  }

  return url;
}
