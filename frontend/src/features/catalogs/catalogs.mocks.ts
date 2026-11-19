import type { DocumentNode } from "@apollo/client";
import type { MockLink } from "@apollo/client/testing";
import { DEFAULT_PAGE_SIZE } from "@/shared/components";
import type { PageInput, SortInput } from "@/shared/graphql";
import { DEFAULT_CATALOG_SORT } from "./catalogs.constants";
import type { CatalogItem } from "./catalogs.types";

/** The variables of a catalog list query. Both catalogs have this shape, so the factory below works for both. */
export interface CatalogListVariables {
  page: PageInput;
  search?: string | null | undefined;
  sort?: SortInput | null | undefined;
}

interface MockOptions {
  variables?: CatalogListVariables;
  /** Number of items on all pages (default: the number of items). */
  total?: number;
}

interface RefusalOptions {
  code?: string;
  message?: string;
}

/**
 * What differs between the catalogs: the GraphQL documents, the name in the messages and the shape of each result.
 * The generated `data` types differ by field name only, so each catalog gives the functions that build them.
 */
export interface CatalogMocksConfig<
  TItem extends CatalogItem,
  TListData extends Record<string, unknown>,
> {
  /** Singular name in the backend messages, for example `Department`. */
  noun: string;
  /** Name of the rows made by `many`, for example `Department` gives `Department 01`. */
  generatedName: string;
  listDocument: DocumentNode;
  createDocument: DocumentNode;
  updateDocument: DocumentNode;
  deleteDocument: DocumentNode;
  /** A row with this id and name, with its `__typename`. */
  item: (id: string, name: string) => TItem;
  /** The data of the list query, for example `{ departments: { __typename: "DepartmentPage", items, total } }`. */
  listData: (items: TItem[], total: number) => TListData;
  /** The data of the mutations, for example `{ createDepartment: item }`. */
  createData: (item: TItem) => object;
  updateData: (item: TItem) => object;
  deleteData: () => object;
}

/** A GraphQL error as the backend sends it, for example `CONFLICT` for a taken name or an item in use. */
const refused = (code: string, message: string) => ({
  errors: [{ message, extensions: { code } }],
});

/**
 * Builds the MockedProvider responses of one catalog (list query, create, update, delete) and the stand-in backend for
 * stories. `departments.mocks.ts` and `positions.mocks.ts` call it and export the results under their own names.
 */
export function createCatalogMocks<
  TItem extends CatalogItem,
  TListData extends Record<string, unknown>,
>(config: CatalogMocksConfig<TItem, TListData>) {
  const { noun, listDocument, item } = config;

  /** The variables of the first request of the page: page 1 of 10 rows, sorted by name ascending. No search: it is left out. */
  const defaultVariables: CatalogListVariables = {
    page: { number: 1, size: 10 },
    sort: DEFAULT_CATALOG_SORT,
  };

  /** Variables for a search, a sort or a page. A MockedProvider answers only a request with the same variables. */
  const variablesFor = (changes: Partial<CatalogListVariables> = {}): CatalogListVariables => ({
    ...defaultVariables,
    ...changes,
  });

  /** MockedProvider response of the list query. */
  const listMock = (
    items: TItem[],
    { variables = defaultVariables, total }: MockOptions = {},
  ): MockLink.MockedResponse => ({
    request: { query: listDocument, variables },
    result: { data: config.listData(items, total ?? items.length) },
  });

  /** A failed list query (a network error). */
  const listErrorMock = (
    variables: CatalogListVariables = defaultVariables,
  ): MockLink.MockedResponse => ({
    request: { query: listDocument, variables },
    error: new Error("Failed to fetch"),
  });

  /** Items named `<generatedName> 01` … for a list of more than one page. */
  const many = (count: number): TItem[] =>
    Array.from({ length: count }, (_, index) => {
      const number = String(index + 1).padStart(2, "0");
      return item(`gen-${number}`, `${config.generatedName} ${number}`);
    });

  /**
   * A stand-in for the backend, for stories: it answers every request, whatever the search, the sort or the page, with
   * the rules of the real backend (search in the name without regard to case, sort by name, ascending by default, 10
   * rows on a page). It lives in the mocks so a story works when the user types or clicks. The page never filters,
   * sorts or cuts pages itself.
   */
  const fakeBackendMock = (all: TItem[]): MockLink.MockedResponse => ({
    // A function for `variables` matches every request (Apollo Client 4); the mock is reused without a limit.
    request: { query: listDocument, variables: () => true },
    maxUsageCount: Number.POSITIVE_INFINITY,
    result: (variables: CatalogListVariables) => {
      const search = variables.search?.trim().toLowerCase();
      const matching = search ? all.filter((row) => row.name.toLowerCase().includes(search)) : all;
      const direction = variables.sort?.direction === "DESC" ? -1 : 1;
      const sorted = [...matching].sort((a, b) => a.name.localeCompare(b.name) * direction);
      const number = variables.page.number ?? 1;
      const size = variables.page.size ?? DEFAULT_PAGE_SIZE;
      return {
        data: config.listData(sorted.slice((number - 1) * size, number * size), matching.length),
      };
    },
  });

  const createRequest = (name: string) => ({
    query: config.createDocument,
    variables: { input: { name } },
  });

  /** The create mutation: the backend returns the new item with an id. */
  const createMock = (name: string, id = "new-1"): MockLink.MockedResponse => ({
    request: createRequest(name),
    result: { data: config.createData(item(id, name)) },
  });

  /** The create mutation refused: by default `CONFLICT`, the name is taken. */
  const createRefusedMock = (
    name: string,
    { code = "CONFLICT", message = `${noun} already exists` }: RefusalOptions = {},
  ): MockLink.MockedResponse => ({
    request: createRequest(name),
    result: refused(code, message),
  });

  /** The create mutation that fails before the backend answers (no network). */
  const createNetworkErrorMock = (name: string): MockLink.MockedResponse => ({
    request: createRequest(name),
    error: new Error("Failed to fetch"),
  });

  const updateRequest = (id: string, name: string) => ({
    query: config.updateDocument,
    variables: { input: { id, name } },
  });

  /** The update mutation: the backend returns the saved item. */
  const updateMock = (id: string, name: string): MockLink.MockedResponse => ({
    request: updateRequest(id, name),
    result: { data: config.updateData(item(id, name)) },
  });

  /** The update mutation refused: by default `CONFLICT`, another item has the name. */
  const updateRefusedMock = (
    id: string,
    name: string,
    { code = "CONFLICT", message = `${noun} already exists` }: RefusalOptions = {},
  ): MockLink.MockedResponse => ({
    request: updateRequest(id, name),
    result: refused(code, message),
  });

  const deleteRequest = (id: string) => ({
    query: config.deleteDocument,
    variables: { id },
  });

  /** The delete mutation for the item with this id. */
  const deleteMock = (id: string): MockLink.MockedResponse => ({
    request: deleteRequest(id),
    result: { data: config.deleteData() },
  });

  /** The delete mutation refused: by default `CONFLICT`, a user still has the item. */
  const deleteRefusedMock = (
    id: string,
    {
      code = "CONFLICT",
      message = `${noun} cannot be deleted because it is currently in use`,
    }: RefusalOptions = {},
  ): MockLink.MockedResponse => ({
    request: deleteRequest(id),
    result: refused(code, message),
  });

  /** The delete mutation that fails before the backend answers (no network). */
  const deleteNetworkErrorMock = (id: string): MockLink.MockedResponse => ({
    request: deleteRequest(id),
    error: new Error("Failed to fetch"),
  });

  return {
    defaultVariables,
    variablesFor,
    listMock,
    listErrorMock,
    many,
    fakeBackendMock,
    createMock,
    createRefusedMock,
    createNetworkErrorMock,
    updateMock,
    updateRefusedMock,
    deleteMock,
    deleteRefusedMock,
    deleteNetworkErrorMock,
  };
}
