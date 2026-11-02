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
      },
    },
  },
};

export default config;
