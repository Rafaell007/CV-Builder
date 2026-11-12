import type { CodegenConfig } from "@graphql-codegen/cli";

// Types and typed documents for every operation in a `.graphql` file, generated from the committed
// backend contract (PLAN D3). Setup from the Apollo Client codegen guide, without the client preset.
const config: CodegenConfig = {
  overwrite: true,
  schema: "../backend/schema.gql",
  documents: ["src/**/*.graphql"],
  generates: {
    "src/shared/graphql/generated/graphql.ts": {
      plugins: ["typescript-operations", "typed-document-node"],
      config: {
        // Apollo Client always adds `__typename`, except on the root Query and Mutation types.
        nonOptionalTypename: true,
        skipTypeNameForRoot: true,
        useTypeImports: true,
        // The backend sends a DateTime as an ISO 8601 string (for example 2025-12-31T00:00:00.000Z).
        scalars: { DateTime: "string" },
      },
    },
  },
};

export default config;
