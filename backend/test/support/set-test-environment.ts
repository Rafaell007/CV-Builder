import { getTestDatabaseUrl } from "./test-database-url";

// Runs in every test file before the app is imported, so the config module validates the test URL.
process.env["DATABASE_URL"] = getTestDatabaseUrl();
process.env["JWT_ACCESS_SECRET"] = "integration-test-access-secret-0123456789";
process.env["JWT_REFRESH_SECRET"] = "integration-test-refresh-secret-0123456789";
