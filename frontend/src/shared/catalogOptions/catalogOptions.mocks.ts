import type { MockLink } from "@apollo/client/testing";
import { DepartmentOptionsDocument, PositionOptionsDocument } from "@/shared/graphql";

const department = (id: string, name: string) => ({ __typename: "Department" as const, id, name });
const position = (id: string, name: string) => ({ __typename: "Position" as const, id, name });

/** Made-up catalog items for tests and stories, already sorted by name as the backend sends them. */
export const departmentOptions = {
  dotNet: department("d2", ".NET"),
  java: department("d3", "Java"),
  react: department("d1", "React"),
};

export const positionOptions = {
  dataAnalyst: position("p2", "Data Analyst"),
  projectManager: position("p3", "Project Manager"),
  softwareEngineer: position("p1", "Software Engineer"),
};

type DepartmentOption = ReturnType<typeof department>;
type PositionOption = ReturnType<typeof position>;

/** One `departmentOptions` answer. */
export const departmentOptionsMock = (
  items: readonly DepartmentOption[] = Object.values(departmentOptions),
): MockLink.MockedResponse => ({
  request: { query: DepartmentOptionsDocument },
  result: { data: { departmentOptions: [...items] } },
});

/** One failed `departmentOptions` request (no network). */
export const departmentOptionsErrorMock = (): MockLink.MockedResponse => ({
  request: { query: DepartmentOptionsDocument },
  error: new Error("Failed to fetch"),
});

/** One `positionOptions` answer. */
export const positionOptionsMock = (
  items: readonly PositionOption[] = Object.values(positionOptions),
): MockLink.MockedResponse => ({
  request: { query: PositionOptionsDocument },
  result: { data: { positionOptions: [...items] } },
});

/** One failed `positionOptions` request (no network). */
export const positionOptionsErrorMock = (): MockLink.MockedResponse => ({
  request: { query: PositionOptionsDocument },
  error: new Error("Failed to fetch"),
});
