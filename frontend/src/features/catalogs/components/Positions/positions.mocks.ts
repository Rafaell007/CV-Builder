import type { MockLink } from "@apollo/client/testing";
import { DEFAULT_PAGE_SIZE } from "@/shared/components";
import {
  CreatePositionDocument,
  DeletePositionDocument,
  PositionsDocument,
  type PositionsQuery,
  type PositionsQueryVariables,
  UpdatePositionDocument,
} from "@/shared/graphql";
import { DEFAULT_CATALOG_SORT } from "../../catalogs.constants";
import type { PositionListItem } from "./positions.types";

const position = (id: string, name: string): PositionListItem => ({
  __typename: "Position",
  id,
  name,
});

export const developer = position("1", "Developer");
export const designer = position("2", "Designer");
export const manager = position("3", "Manager");

/** The variables of the first request of the page: page 1 of 10 rows, sorted by name ascending. No search: it is left out. */
export const defaultVariables: PositionsQueryVariables = {
  page: { number: 1, size: 10 },
  sort: DEFAULT_CATALOG_SORT,
};

/** Variables for a search, a sort or a page. A MockedProvider answers only a request with the same variables. */
export const variablesFor = (
  changes: Partial<PositionsQueryVariables> = {},
): PositionsQueryVariables => ({ ...defaultVariables, ...changes });

export const positionsData = (items: PositionListItem[], total = items.length): PositionsQuery => ({
  positions: { __typename: "PositionPage", items, total },
});

interface MockOptions {
  variables?: PositionsQueryVariables;
  /** Number of positions on all pages (default: the number of items). */
  total?: number;
}

/** MockedProvider response of the `Positions` query. */
export const positionsMock = (
  items: PositionListItem[],
  { variables = defaultVariables, total }: MockOptions = {},
): MockLink.MockedResponse => ({
  request: { query: PositionsDocument, variables },
  result: { data: positionsData(items, total) },
});

/** MockedProvider response of a failed `Positions` query (a network error). */
export const positionsErrorMock = (
  variables: PositionsQueryVariables = defaultVariables,
): MockLink.MockedResponse => ({
  request: { query: PositionsDocument, variables },
  error: new Error("Failed to fetch"),
});

/** Positions named `Position 01` … for a list of more than one page. */
export const manyPositions = (count: number): PositionListItem[] =>
  Array.from({ length: count }, (_, index) => {
    const number = String(index + 1).padStart(2, "0");
    return position(`gen-${number}`, `Position ${number}`);
  });

/**
 * A stand-in for the backend, for stories: it answers every request, whatever the search, the sort or the page, with
 * the rules of the real backend (search in the name without regard to case, sort by name, ascending by default, 10 rows
 * on a page). It lives here, in the mocks, so a story works when the user types or clicks. The page never filters,
 * sorts or cuts pages itself.
 */
export const fakeBackendMock = (all: PositionListItem[]): MockLink.MockedResponse => ({
  // A function for `variables` matches every request (Apollo Client 4); the mock is reused without a limit.
  request: { query: PositionsDocument, variables: () => true },
  maxUsageCount: Number.POSITIVE_INFINITY,
  result: (variables: PositionsQueryVariables) => {
    const search = variables.search?.trim().toLowerCase();
    const matching = search ? all.filter((item) => item.name.toLowerCase().includes(search)) : all;
    const direction = variables.sort?.direction === "DESC" ? -1 : 1;
    const sorted = [...matching].sort((a, b) => a.name.localeCompare(b.name) * direction);
    const number = variables.page.number ?? 1;
    const size = variables.page.size ?? DEFAULT_PAGE_SIZE;
    return {
      data: positionsData(sorted.slice((number - 1) * size, number * size), matching.length),
    };
  },
});

/** A GraphQL error as the backend sends it, for example `CONFLICT` for a taken name or a position in use. */
const refused = (code: string, message: string) => ({
  errors: [{ message, extensions: { code } }],
});

/** MockedProvider response of `createPosition`: the backend returns the new position with an id. */
export const createPositionMock = (name: string, id = "new-1"): MockLink.MockedResponse => ({
  request: { query: CreatePositionDocument, variables: { input: { name } } },
  result: { data: { createPosition: position(id, name) } },
});

/** `createPosition` refused: by default `CONFLICT`, the name is taken. */
export const createPositionRefusedMock = (
  name: string,
  { code = "CONFLICT", message = "Position already exists" } = {},
): MockLink.MockedResponse => ({
  request: { query: CreatePositionDocument, variables: { input: { name } } },
  result: refused(code, message),
});

/** `createPosition` that fails before the backend answers (no network). */
export const createPositionNetworkErrorMock = (name: string): MockLink.MockedResponse => ({
  request: { query: CreatePositionDocument, variables: { input: { name } } },
  error: new Error("Failed to fetch"),
});

/** MockedProvider response of `updatePosition`: the backend returns the saved position. */
export const updatePositionMock = (id: string, name: string): MockLink.MockedResponse => ({
  request: { query: UpdatePositionDocument, variables: { input: { id, name } } },
  result: { data: { updatePosition: position(id, name) } },
});

/** `updatePosition` refused: by default `CONFLICT`, another position has the name. */
export const updatePositionRefusedMock = (
  id: string,
  name: string,
  { code = "CONFLICT", message = "Position already exists" } = {},
): MockLink.MockedResponse => ({
  request: { query: UpdatePositionDocument, variables: { input: { id, name } } },
  result: refused(code, message),
});

/** MockedProvider response of `deletePosition` for the position with this id. */
export const deletePositionMock = (id: string): MockLink.MockedResponse => ({
  request: { query: DeletePositionDocument, variables: { id } },
  result: { data: { deletePosition: true } },
});

/** `deletePosition` refused: by default `CONFLICT`, a user still has the position. */
export const deletePositionRefusedMock = (
  id: string,
  { code = "CONFLICT", message = "Position cannot be deleted because it is currently in use" } = {},
): MockLink.MockedResponse => ({
  request: { query: DeletePositionDocument, variables: { id } },
  result: refused(code, message),
});

/** `deletePosition` that fails before the backend answers (no network). */
export const deletePositionNetworkErrorMock = (id: string): MockLink.MockedResponse => ({
  request: { query: DeletePositionDocument, variables: { id } },
  error: new Error("Failed to fetch"),
});
