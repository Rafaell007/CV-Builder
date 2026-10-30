import { truncateTables } from "./truncate-tables";

// Registered as a setup file, so it runs once for every integration test file.
beforeAll(truncateTables);
