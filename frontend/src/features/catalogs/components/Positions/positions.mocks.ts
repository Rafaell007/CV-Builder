import {
  CreatePositionDocument,
  DeletePositionDocument,
  PositionsDocument,
  type PositionsQuery,
  UpdatePositionDocument,
} from "@/shared/graphql";
import { createCatalogMocks } from "../../catalogs.mocks";
import type { PositionListItem } from "./positions.types";

const item = (id: string, name: string): PositionListItem => ({
  __typename: "Position",
  id,
  name,
});

const mocks = createCatalogMocks({
  noun: "Position",
  generatedName: "Position",
  listDocument: PositionsDocument,
  createDocument: CreatePositionDocument,
  updateDocument: UpdatePositionDocument,
  deleteDocument: DeletePositionDocument,
  item,
  listData: (items, total): PositionsQuery => ({
    positions: { __typename: "PositionPage", items, total },
  }),
  createData: (created) => ({ createPosition: created }),
  updateData: (saved) => ({ updatePosition: saved }),
  deleteData: () => ({ deletePosition: true }),
});

export const developer = item("1", "Developer");
export const designer = item("2", "Designer");
export const manager = item("3", "Manager");

export const defaultVariables = mocks.defaultVariables;
export const variablesFor = mocks.variablesFor;
export const fakeBackendMock = mocks.fakeBackendMock;
export const positionsMock = mocks.listMock;
export const positionsErrorMock = mocks.listErrorMock;
export const manyPositions = mocks.many;
export const createPositionMock = mocks.createMock;
export const createPositionRefusedMock = mocks.createRefusedMock;
export const createPositionNetworkErrorMock = mocks.createNetworkErrorMock;
export const updatePositionMock = mocks.updateMock;
export const updatePositionRefusedMock = mocks.updateRefusedMock;
export const deletePositionMock = mocks.deleteMock;
export const deletePositionRefusedMock = mocks.deleteRefusedMock;
export const deletePositionNetworkErrorMock = mocks.deleteNetworkErrorMock;
