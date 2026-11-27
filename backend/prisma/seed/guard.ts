// The seed sets known passwords (credentials.ts) and overwrites them on every run, so it must not reach a deployed database.
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1"]);
// Same rule as getTestDatabaseUrl in test/support: the integration and E2E database.
const TEST_DATABASE_NAME = /^[a-z0-9_]+_test$/;

function parseConnectionString(connectionString: string): URL {
  try {
    return new URL(connectionString);
  } catch {
    // The TypeError from URL keeps the whole input, with the password, in its `input` property.
    throw new Error("Refusing to seed: DATABASE_URL is not a valid URL.");
  }
}

export function assertSeedAllowed(connectionString: string, env: NodeJS.ProcessEnv): void {
  if (env["NODE_ENV"] === "production") {
    throw new Error(
      "Refusing to seed: NODE_ENV is production. The seed creates users with a known password.",
    );
  }

  const url = parseConnectionString(connectionString);
  // The pg driver connects to the host query parameter when there is one, not to the host of the address.
  // Prisma migrate reset may read these parameters in another way, so every host source must be local.
  // URL keeps the case of the host for a postgresql: address, but host names are case-insensitive.
  // No host at all means the default host, which is localhost.
  const hostnames = [url.hostname, url.searchParams.get("host"), url.searchParams.get("hostaddr")]
    .filter((hostname): hostname is string => Boolean(hostname))
    .map((hostname) => hostname.toLowerCase());
  const remoteHostname = hostnames.find((hostname) => !LOCAL_HOSTS.has(hostname));
  const databaseName = url.pathname.slice(1);
  const isLocal = remoteHostname === undefined || TEST_DATABASE_NAME.test(databaseName);

  if (!isLocal && env["SEED_ALLOW_REMOTE"] !== "1") {
    throw new Error(
      `Refusing to seed "${databaseName}" on host "${remoteHostname}": it is not a local or test database. ` +
        "To seed a remote demo database on purpose, set SEED_ALLOW_REMOTE=1.",
    );
  }
}
