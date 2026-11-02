import { getTestDatabaseUrl } from "./test-database-url";

// Runs in every test file before the app is imported, so the config module validates the test URL.
process.env["DATABASE_URL"] = getTestDatabaseUrl();
