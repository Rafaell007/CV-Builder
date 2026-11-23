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
  const message = "The generated GraphQL file is missing or stale. Run: pnpm --filter @cv-builder/frontend codegen";
  if (!existsSync(generatedFile)) throw new Error(message);

  const generatedTime = statSync(generatedFile).mtimeMs;
  const sources = [...findGraphqlFiles(path.join(dirname, "src")), schemaFile];
  if (sources.some((source) => existsSync(source) && statSync(source).mtimeMs > generatedTime)) {
    throw new Error(message);
  }
}
