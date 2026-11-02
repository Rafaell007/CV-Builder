// Server Components only. Kept apart from ../index.ts so Client Components never import server code.
export { getClient, PreloadQuery, query } from "./apolloServerClient";
