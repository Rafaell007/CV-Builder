import { DEFAULT_PAGE_SIZE } from "../Pagination";
import type { SortState } from "./DataTable.types";

/** Mock data and a fake list query for the stories. It has the shape of the backend list pattern (PLAN §3). */
export interface MockUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  position: string;
}

const FIRST_NAMES = ["Ada", "Grace", "Linus", "Margaret", "Alan", "Barbara", "Dennis"];
const LAST_NAMES = ["Lovelace", "Hopper", "Torvalds", "Hamilton", "Turing", "Liskov", "Ritchie"];
const DEPARTMENTS = ["Engineering", "Design", "Management"];
const POSITIONS = ["Developer", "Designer", "Team lead", "Tester", "Analyst"];

export const MOCK_USERS: MockUser[] = Array.from({ length: 35 }, (_, index) => {
  const firstName = FIRST_NAMES[index % FIRST_NAMES.length]!;
  const lastName = LAST_NAMES[(index * 3) % LAST_NAMES.length]!;
  return {
    id: String(index + 1),
    firstName,
    lastName,
    email: `${firstName}.${lastName}${index + 1}@example.com`.toLowerCase(),
    department: DEPARTMENTS[index % DEPARTMENTS.length]!,
    position: POSITIONS[index % POSITIONS.length]!,
  };
});

export interface MockListQuery {
  search?: string;
  sort?: SortState | undefined;
  /** Starts at 1. */
  page: number;
}

export interface MockListResult {
  items: MockUser[];
  total: number;
}

const SORT_FIELDS = ["firstName", "lastName", "department", "position"] as const;

/** Applies search (first name, last name, email), sort and page the way the backend does. */
export function queryMockUsers({ search, sort, page }: MockListQuery): MockListResult {
  const term = search?.trim().toLowerCase() ?? "";
  const matches = MOCK_USERS.filter((user) =>
    [user.firstName, user.lastName, user.email].some((value) => value.toLowerCase().includes(term)),
  );

  const field = SORT_FIELDS.find((name) => name === sort?.field);
  if (field && sort) {
    const factor = sort.direction === "ASC" ? 1 : -1;
    matches.sort((a, b) => a[field].localeCompare(b[field]) * factor);
  }

  const start = (page - 1) * DEFAULT_PAGE_SIZE;
  return { items: matches.slice(start, start + DEFAULT_PAGE_SIZE), total: matches.length };
}
