import { existsSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const generatedFile = path.join(dirname, "src/shared/graphql/generated/graphql.ts");
const schemaFile = path.join(dirname, "../backend/schema.gql");

function findGraphqlFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return findGraphqlFiles(fullPath);
    return entry.name.endsWith(".graphql") ? [fullPath] : [];
  });
}

// The generated file is in .gitignore. After a pull it can be older than its sources. Tests then fail with
// errors from Apollo MockedProvider that do not name the cause, so stop early with a clear message.
export default function setup() {
  // Vitest 5 hides an error thrown here behind "code.charCodeAt is not a function", so print the message and exit.
  const fail = () => {
    console.error(
      "\nThe generated GraphQL file is missing or stale. Run: pnpm --filter @cv-builder/frontend codegen\n",
    );
    process.exit(1);
  };
  if (!existsSync(generatedFile)) fail();

  // `pnpm codegen` updates the time of the generated file on every run, so it is newer than its sources after it.
  const generatedTime = statSync(generatedFile).mtimeMs;
  const sources = [...findGraphqlFiles(path.join(dirname, "src")), schemaFile];
  if (sources.some((source) => existsSync(source) && statSync(source).mtimeMs > generatedTime))
    fail();
}
