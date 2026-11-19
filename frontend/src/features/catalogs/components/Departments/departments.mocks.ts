import {
  CreateDepartmentDocument,
  DeleteDepartmentDocument,
  DepartmentsDocument,
  type DepartmentsQuery,
  UpdateDepartmentDocument,
} from "@/shared/graphql";
import { createCatalogMocks } from "../../catalogs.mocks";
import type { DepartmentListItem } from "./departments.types";

const item = (id: string, name: string): DepartmentListItem => ({
  __typename: "Department",
  id,
  name,
});

const mocks = createCatalogMocks({
  noun: "Department",
  generatedName: "Department",
  listDocument: DepartmentsDocument,
  createDocument: CreateDepartmentDocument,
  updateDocument: UpdateDepartmentDocument,
  deleteDocument: DeleteDepartmentDocument,
  item,
  listData: (items, total): DepartmentsQuery => ({
    departments: { __typename: "DepartmentPage", items, total },
  }),
  createData: (created) => ({ createDepartment: created }),
  updateData: (saved) => ({ updateDepartment: saved }),
  deleteData: () => ({ deleteDepartment: true }),
});

export const engineering = item("1", "Engineering");
export const finance = item("2", "Finance");
export const marketing = item("3", "Marketing");

export const defaultVariables = mocks.defaultVariables;
export const variablesFor = mocks.variablesFor;
export const fakeBackendMock = mocks.fakeBackendMock;
export const departmentsMock = mocks.listMock;
export const departmentsErrorMock = mocks.listErrorMock;
export const manyDepartments = mocks.many;
export const createDepartmentMock = mocks.createMock;
export const createDepartmentRefusedMock = mocks.createRefusedMock;
export const createDepartmentNetworkErrorMock = mocks.createNetworkErrorMock;
export const updateDepartmentMock = mocks.updateMock;
export const updateDepartmentRefusedMock = mocks.updateRefusedMock;
export const deleteDepartmentMock = mocks.deleteMock;
export const deleteDepartmentRefusedMock = mocks.deleteRefusedMock;
export const deleteDepartmentNetworkErrorMock = mocks.deleteNetworkErrorMock;
