// Glossary for the hover boxes. Facts marked "verified" were read in the repo; the rest is general knowledge about the tool.
// Fields: name, kind, what (plain text), where (list of file or function names), code (pseudo code or real code, plain text).
export const gloss = {
  graphql: {
    name: "GraphQL",
    kind: "Query language",
    what: "A way for the browser to ask the backend for exactly the fields it needs. Every request goes to one URL, /graphql. The contract (types and arguments) is the generated file backend/schema.gql.",
    where: ["backend/schema.gql (the contract)", "frontend: .graphql files, then codegen"],
    code: `query Projects($search: String, $sort: SortInput, $page: PageInput) {
  projects(search: $search, sort: $sort, page: $page) {
    items { id name domain }   # example fields
    total
  }
}`,
  },
  post: {
    name: "POST /graphql",
    kind: "HTTP request",
    what: "The one HTTP request Apollo sends for a query. The browser calls the frontend's own /graphql. Next.js rewrites it to the backend, and the browser sends the auth cookies by itself (verified: frontend/src/shared/apollo/README.md).",
    where: [
      "frontend/src/shared/apollo/ApolloClientProvider.tsx",
      "backend: http://localhost:4000/graphql",
    ],
    code: `POST /graphql
{
  "operationName": "Projects",
  "query": "query Projects($search: String, ...) { projects(...) { items { ... } total } }",
  "variables": {
    "search": "ada",
    "sort": { "field": "name", "direction": "ASC" },
    "page": { "number": 2, "size": 10 }
  }
}`,
  },
  apollo: {
    name: "Apollo Client 4",
    kind: "Library (frontend)",
    what: "Sends GraphQL requests, keeps the results in a cache, and sends a new request when the variables of a query change. Components use its hooks from @apollo/client/react.",
    where: [
      "frontend/src/shared/apollo/ApolloClientProvider.tsx",
      "errorLink: logs errors",
      "sessionLink: one session refresh on UNAUTHENTICATED, then repeats the request",
    ],
    code: `const { data, loading, error, refetch } =
  useQuery(ProjectsDocument, { variables })`,
  },
  usequery: {
    name: "useQuery",
    kind: "Apollo hook",
    what: "Runs a query when the component renders. When the values inside variables change, Apollo sends a new request by itself. You do not call fetch.",
    where: ["@apollo/client/react", "used inside useProjects (step 6)"],
    code: `// variables = { search: "ada", page: { number: 1, size: 10 } }
const { data, loading } = useQuery(ProjectsDocument, { variables })
// the admin types "bob" -> variables.search changes -> new request`,
  },
  nextjs: {
    name: "Next.js 16",
    kind: "Framework (frontend)",
    what: "Serves the pages. Routes live in frontend/src/app/[locale]/. It also rewrites /graphql to the backend, so the browser talks to one address.",
    where: [
      "frontend/src/app/[locale]/(app)/admin/projects/page.tsx (route, a stub today)",
      "frontend/next.config.ts (rewrite)",
    ],
    code: `// route file stays thin:
export default function Page() { return <Projects /> }`,
  },
  nestjs: {
    name: "NestJS 11",
    kind: "Framework (backend)",
    what: "Structures the backend in modules. A resolver is thin and receives the GraphQL call. A service holds the business rules. Guards run before the resolver.",
    where: [
      "backend/src/modules/projects/projects.module.ts",
      "projects.resolver.ts, projects.service.ts",
    ],
    code: `request -> guard (role) -> resolver (thin) -> service (rules) -> Prisma`,
  },
  guard: {
    name: "Roles guard",
    kind: "Backend check",
    what: "Runs before the resolver. The decorator @Roles(Role.ADMIN) on ProjectsResolver lets only administrators call any projects operation (verified: projects.resolver.ts). The check is on the backend, so a changed browser cannot skip it.",
    where: ["backend/src/modules/projects/projects.resolver.ts", "backend/src/common/auth"],
    code: `@Roles(Role.ADMIN)
@Resolver(() => Project)
export class ProjectsResolver {
  @Query(() => ProjectPage, { name: "projects" })
  list(@Args() args: ListArgs) { return this.service.list(args) }
}`,
  },
  session: {
    name: "Auth cookies (session)",
    kind: "Concept",
    what: "The browser proves who the admin is with cookies that it sends with every request. When a request fails with UNAUTHENTICATED, the sessionLink refreshes the session once and repeats the request (verified: shared/apollo/README.md).",
    where: ["frontend/src/shared/apollo/sessionLink", "frontend/src/shared/session"],
    code: `request fails: UNAUTHENTICATED
  -> refreshSession()   (one time, single-flight)
  -> repeat the request once
  -> still refused: go to /sign-in`,
  },
  service: {
    name: "ProjectsService.list",
    kind: "Our backend file",
    what: "Builds the database query from the three inputs and returns one page and the total (verified: projects.service.ts). It already exists. This story does not change it.",
    where: [
      "backend/src/modules/projects/projects.service.ts",
      "resolveSort, toSkipTake: backend/src/common/pagination/pagination.utils.ts",
    ],
    code: `async list({ search, sort, page }) {
  const { field, direction } = resolveSort(sort, ["name","startDate","endDate"], { field: "name", direction: "asc" })
  const where = search
    ? { OR: [ { name:   { contains: search, mode: "insensitive" } },
              { domain: { contains: search, mode: "insensitive" } } ] }
    : {}
  const [rows, total] = await prisma.$transaction([
    prisma.project.findMany({ where, orderBy: [{ [field]: direction }, { id: "asc" }], ...toSkipTake(page) }),
    prisma.project.count({ where }),
  ])
  return { items: rows.map(toProject), total }
}`,
  },
  prisma: {
    name: "Prisma 7",
    kind: "Library (backend, ORM)",
    what: "You write the query as a TypeScript object (where, orderBy, skip, take). Prisma writes the SQL, sends it to PostgreSQL and returns typed rows. The tables are described in backend/prisma/schema.prisma.",
    where: [
      "backend/prisma/ (schema, migrations, seed)",
      "backend/src/prisma/prisma.service.ts",
      "backend/src/generated/prisma (generated client)",
    ],
    code: `prisma.project.findMany({
  where: { OR: [ { name: { contains: "ada", mode: "insensitive" } }, ... ] },
  orderBy: [{ name: "asc" }, { id: "asc" }],
  skip: 10,   // (page.number - 1) * page.size
  take: 10,   // page.size
})`,
  },
  postgres: {
    name: "PostgreSQL 17",
    kind: "Database",
    what: "Stores the projects and does the filtering, sorting and cutting. It does this for all rows, with its own query engine, and sends only one page back.",
    where: ["docker compose up -d (local database)", "backend/prisma/seed (test projects)"],
    code: `-- roughly what Prisma sends (the exact SQL differs)
SELECT * FROM "Project"
WHERE name ILIKE '%ada%' OR domain ILIKE '%ada%'
ORDER BY name ASC, id ASC
LIMIT 10 OFFSET 10;

SELECT COUNT(*) FROM "Project"
WHERE name ILIKE '%ada%' OR domain ILIKE '%ada%';`,
  },
  page: {
    name: "ProjectPage { items, total }",
    kind: "Backend answer",
    what: "One page of rows and the number of all matching rows. The browser needs total to know how many page buttons to draw. The rows are already in the right order (verified: models/project-page.ts).",
    where: ["backend/src/modules/projects/models/project-page.ts"],
    code: `{
  "data": { "projects": {
    "items": [ { "id": "...", "name": "Alpha" }, ... 10 rows ],
    "total": 25
  } }
}`,
  },
  cache: {
    name: "Apollo cache",
    kind: "Library part",
    what: "Apollo stores each result under the query and its variables. By default the same query with the same variables is answered from the cache, so going back to page 1 can be instant.",
    where: ["created inside ApolloClientProvider (frontend/src/shared/apollo)"],
    code: `cache key  ~  "Projects" + { search: "ada", page: { number: 2, size: 10 } }
same key again -> answer from the cache
new key        -> POST /graphql`,
  },
  json: {
    name: "JSON response",
    kind: "Data format",
    what: "Text in a fixed shape: braces, names and values. Apollo reads it and gives data to the component.",
    where: ["the body of the HTTP answer to POST /graphql"],
    code: `{ "data": { "projects": { "items": [ ... ], "total": 25 } } }`,
  },
  projectspage: {
    name: "Projects page",
    kind: "New in step 1 (the end of KAN-127)",
    what: "The component that the route /admin/projects shows: the table, and an error with Retry when the request fails. Today the route is a stub with only a heading, and features/projects has no page component (both verified).",
    where: [
      "frontend/src/features/projects/Projects.tsx (planned)",
      "frontend/src/app/[locale]/(app)/admin/projects/page.tsx (route, a stub today)",
    ],
    code: `function Projects():
  { rows, loading, error, retry } = useProjectsPage()
  if error -> <PageState kind="error" onRetry={retry} ... />
  return <> <h1>...</h1> <ProjectsTable rows={rows} loading={loading} /> </>   // pseudo code`,
  },
  querystate: {
    name: "useProjectsQueryState",
    kind: "Our new hook (steps 2 to 4)",
    what: "Holds the three values of the list (search, sort, page) with useState. Returns them with setters and the ready variables. It is new in this story.",
    where: [
      "frontend/src/features/projects/useProjectsQueryState/useProjectsQueryState.ts",
      "types: projects-query.types.ts",
      "helpers: utils/projects-query.utils.ts",
    ],
    code: `const [state, setState] = useState({ search: "", sort: undefined, page: 1 })
const variables = useMemo(() => toVariables(state), [state])
const setSearch = (s) => setState((c) => withSearch(c, s))   // page back to 1
const setSort   = (s) => setState((c) => withSort(c, s))     // page back to 1
const setPage   = (p) => setState((c) => withPage(c, p))
return { state, variables, setSearch, setSort, setPage, syncTotal }`,
  },
  vars: {
    name: "State to variables",
    kind: "Our pure function",
    what: "toVariables turns the state into the object that goes to the query. It leaves a key out when the value is empty, and it always adds page size 10.",
    where: ["frontend/src/features/projects/useProjectsQueryState/utils/projects-query.utils.ts"],
    code: `function toVariables(state):
  variables = { page: { number: state.page, size: DEFAULT_PAGE_SIZE } }
  text = state.search.trim()
  if text is not empty -> variables.search = text
  if state.sort exists -> variables.sort = state.sort
  return variables`,
  },
  changed: {
    name: "Variables changed",
    kind: "Concept",
    what: "A new variables object with different values makes useQuery send a new request. Because of this, you never write code like: when the admin clicks, call the backend.",
    where: ["useProjects (step 6)"],
    code: `{ page: { number: 1, size: 10 } }
  -> admin types "ada" ->
{ page: { number: 1, size: 10 }, search: "ada" }   // new request`,
  },
  hook: {
    name: "useProjects",
    kind: "KAN-127 hook, changed in step 6",
    what: "Runs the projects query. It exists on the projects-list branch (verified). Today it sends a fixed page 1 with size 10. In step 6 it takes the variables as an argument.",
    where: ["frontend/src/features/projects/useProjects/useProjects.ts (exists, verified)"],
    code: `export function useProjects(variables) {
  const { data, loading, error, refetch } = useQuery(ProjectsDocument, { variables })
  return { rows: data?.projects.items ?? [], total: data?.projects.total ?? 0, loading, error, refetch }
}`,
  },
  codegen: {
    name: "codegen",
    kind: "Tool",
    what: "Reads backend/schema.gql and the .graphql files and writes TypeScript types and the ProjectsDocument object. Do not edit the generated files. dev, build, typecheck and test run it first.",
    where: [
      "pnpm --filter @cv-builder/frontend codegen",
      "frontend/codegen.ts",
      "output: @/shared/graphql",
    ],
    code: `projects.graphql  +  backend/schema.gql
   -> codegen ->
ProjectsDocument, ProjectsQueryVariables, ProjectsQuery`,
  },
  usestate: {
    name: "useState",
    kind: "React hook",
    what: "Keeps a value between renders. Calling its setter renders the component again with the new value.",
    where: ["react"],
    code: `const [page, setPage] = useState(1)
setPage(2)   // the component renders again, page is 2`,
  },
  pure: {
    name: "Pure function",
    kind: "Concept",
    what: "A function that returns a result from its input and changes nothing else. The same input always gives the same result. This makes it the easiest code to test (PLAN 5.8).",
    where: ["utils/ folders"],
    code: `function withPage(state, page) { return { ...state, page } }   // pure
withPage({ search: "a", page: 1 }, 3)  ->  { search: "a", page: 3 }`,
  },
  searchbox: {
    name: "SearchField",
    kind: "Shared component (exists)",
    what: "A search input. It is not controlled: defaultValue sets only the first text. It waits 300 ms after the last key, then calls onSearch once (the debounce).",
    where: ["frontend/src/shared/components/SearchField (see its README)"],
    code: `<SearchField label={t("search.label")} placeholder={t("search.placeholder")}
             defaultValue={state.search} onSearch={setSearch} />`,
  },
  table: {
    name: "DataTable",
    kind: "Shared component (exists)",
    what: "Draws rows and column titles. It is controlled: it shows the sort you give it and reports a click through onSortChange. A click cycles none, ASC, DESC, none. It never reorders the rows itself.",
    where: ["frontend/src/shared/components/DataTable", "SortHeaderCell, sort.utils"],
    code: `<DataTable columns={columns} rows={items}
           sort={state.sort} onSortChange={setSort} loading={loading} ... />
// column: { header: "Name", sortField: "name", ... }`,
  },
  pager: {
    name: "Pagination",
    kind: "Shared component (exists)",
    what: "Draws the page buttons from page, total and pageSize. It is controlled and reports a click through onPageChange.",
    where: ["frontend/src/shared/components/Pagination"],
    code: `<Pagination page={state.page} total={total} pageSize={DEFAULT_PAGE_SIZE}
            onPageChange={setPage} labels={...} />`,
  },
  pagesize: {
    name: "DEFAULT_PAGE_SIZE",
    kind: "Constant",
    what: "The page size of the list: 10 (PLAN D19). Send it in every query. The backend default is 20, and a different size would break the page numbers.",
    where: ["@/shared/components/Pagination (folder index, verified)"],
    code: `variables.page = { number: 3, size: DEFAULT_PAGE_SIZE }   // size 10`,
  },
  offset: {
    name: "skip and take",
    kind: "Concept (verified)",
    what: "How the backend cuts a page: it skips the rows of the earlier pages and takes one page. toSkipTake does the sum.",
    where: ["backend/src/common/pagination/pagination.utils.ts"],
    code: `skip = (page.number - 1) * page.size
take = page.size
// page 3, size 10 -> skip 20, take 10`,
  },
  nofilter: {
    name: "Browser filter or sort",
    kind: "Not allowed (AC-8, AC-12)",
    what: 'The browser holds one page only. Filtering or sorting that page gives a wrong answer for the whole list. See the worked example on the "Why the backend" page.',
    where: ["rule of the story: AC-8 and AC-12"],
    code: `// WRONG
rows.filter((r) => r.name.includes(text)).sort(byName)
// RIGHT: send variables, show rows in the order they arrive`,
  },
};

// Text that becomes a hover word. Longest first.
export const termMap = [
  ["useProjectsQueryState", "querystate"],
  ["ProjectsService.list", "service"],
  ["ProjectsService", "service"],
  ["DEFAULT_PAGE_SIZE", "pagesize"],
  ["POST /graphql", "post"],
  ["Apollo Client", "apollo"],
  ["useProjects", "hook"],
  ["SearchField", "searchbox"],
  ["toVariables", "vars"],
  ["PostgreSQL", "postgres"],
  ["pure functions", "pure"],
  ["pure function", "pure"],
  ["DataTable", "table"],
  ["Pagination", "pager"],
  ["useQuery", "usequery"],
  ["useState", "usestate"],
  ["GraphQL", "graphql"],
  ["Next.js", "nextjs"],
  ["codegen", "codegen"],
  ["Prisma", "prisma"],
  ["NestJS", "nestjs"],
  ["Apollo", "apollo"],
  ["cookies", "session"],
];

// Chart: bubble title -> key, arrow label -> key.
export const chartBubbles = {
  "Search box": "searchbox",
  "Sort header": "table",
  "Page control": "pager",
  "Query state": "querystate",
  "useProjects hook": "hook",
  "Apollo Client": "apollo",
  "Roles guard": "guard",
  ProjectsService: "service",
  PostgreSQL: "postgres",
  ProjectPage: "page",
  "Apollo cache": "cache",
  "Table + pager": "table",
  "Browser filter": "nofilter",
};
export const chartLabels = {
  "state becomes variables": "vars",
  "variables changed": "changed",
  "POST /graphql": "post",
  Prisma: "prisma",
  "JSON response": "json",
  "if ADMIN": "guard",
  "items + total": "page",
  "rows + total": "postgres",
  "rows, total": "cache",
  "search text": "searchbox",
  "sort field": "table",
  "page number": "pager",
};
