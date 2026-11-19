import { describe, expect, it } from "vitest";
import { DepartmentsDocument } from "@/shared/graphql";
import {
  createDepartmentMock,
  createDepartmentRefusedMock,
  defaultVariables,
  deleteDepartmentRefusedMock,
  departmentsMock,
  engineering,
  fakeBackendMock,
  finance,
  manyDepartments,
  variablesFor,
} from "./components/Departments/departments.mocks";

type Result = { data: { departments: { items: { name: string }[]; total: number } } };

describe("createCatalogMocks (checked through the departments mocks)", () => {
  it("builds a list response with the total of all pages", () => {
    const mock = departmentsMock([engineering], { total: 25 });

    expect(mock.request).toEqual({ query: DepartmentsDocument, variables: defaultVariables });
    expect(mock.result).toEqual({
      data: { departments: { __typename: "DepartmentPage", items: [engineering], total: 25 } },
    });
  });

  it("merges the changes into the default variables", () => {
    expect(variablesFor({ search: "fin" })).toEqual({ ...defaultVariables, search: "fin" });
  });

  it("names the generated rows with two digits", () => {
    const rows = manyDepartments(11);

    expect(rows).toHaveLength(11);
    expect(rows[0]?.name).toBe("Department 01");
    expect(rows[10]?.name).toBe("Department 11");
  });

  it("returns the created item and refuses with CONFLICT and the noun of the catalog", () => {
    expect(createDepartmentMock("Legal", "9").result).toEqual({
      data: { createDepartment: { __typename: "Department", id: "9", name: "Legal" } },
    });
    expect(createDepartmentRefusedMock("Legal").result).toEqual({
      errors: [{ message: "Department already exists", extensions: { code: "CONFLICT" } }],
    });
    expect(deleteDepartmentRefusedMock("1").result).toEqual({
      errors: [
        {
          message: "Department cannot be deleted because it is currently in use",
          extensions: { code: "CONFLICT" },
        },
      ],
    });
  });

  it("answers as the backend: search, sort and pages", () => {
    const backend = fakeBackendMock([...manyDepartments(12), engineering, finance]);
    const answer = (variables: ReturnType<typeof variablesFor>) => {
      const result = backend.result;
      if (typeof result !== "function") throw new Error("expected a result function");
      return result(variables) as Result;
    };

    const search = answer(variablesFor({ search: " FIN " }));
    expect(search.data.departments.items.map((row) => row.name)).toEqual(["Finance"]);
    expect(search.data.departments.total).toBe(1);

    const secondPage = answer(variablesFor({ page: { number: 2, size: 10 } }));
    expect(secondPage.data.departments.items).toHaveLength(4);
    expect(secondPage.data.departments.total).toBe(14);

    const descending = answer(variablesFor({ sort: { field: "name", direction: "DESC" } }));
    expect(descending.data.departments.items[0]?.name).toBe("Finance");
  });
});
