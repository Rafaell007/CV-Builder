import { gql, type TypedDocumentNode } from "@apollo/client";
import type { MockLink } from "@apollo/client/testing";
import { act, waitFor } from "@testing-library/react";
import { useState, type ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { renderWithProviders } from "@/shared/testing";
import type { ListVariables } from "../lists.types";
import { usePagedList } from "./usePagedList";

// A small list query of its own: the shared hook must work with any list query, not only one of the features.
interface Item {
  __typename: "Item";
  id: string;
  name: string;
}
interface ItemsQuery {
  items: { __typename: "ItemPage"; items: Item[]; total: number };
}
const ItemsDocument: TypedDocumentNode<ItemsQuery, ListVariables> = gql`
  query Items($page: PageInput!, $sort: SortInput, $search: String) {
    items(page: $page, sort: $sort, search: $search) {
      items {
        id
        name
      }
      total
    }
  }
`;

const firstPage: ListVariables = {
  page: { number: 1, size: 10 },
  sort: { field: "name", direction: "ASC" },
};
const secondPage: ListVariables = { ...firstPage, page: { number: 2, size: 10 } };
const item = (id: string): Item => ({ __typename: "Item", id, name: `Item ${id}` });

const itemsMock = (
  items: Item[],
  { variables = firstPage, total = items.length, delay = 0 } = {},
): MockLink.MockedResponse => ({
  request: { query: ItemsDocument, variables },
  result: { data: { items: { __typename: "ItemPage", items, total } } },
  delay,
});
const itemsErrorMock = (): MockLink.MockedResponse => ({
  request: { query: ItemsDocument, variables: firstPage },
  error: new Error("Failed to fetch"),
});

// renderWithProviders renders elements; this small component lets the hook run inside the same providers.
function setup(mocks: MockLink.MockedResponse[]) {
  let current!: ReturnType<typeof usePagedList<ItemsQuery, ListVariables, Item>>;
  let changeVariables!: (variables: ListVariables) => void;
  function Probe(): ReactNode {
    const [variables, setVariables] = useState(firstPage);
    changeVariables = setVariables;
    current = usePagedList(ItemsDocument, variables, (data) => data.items);
    return null;
  }
  renderWithProviders(<Probe />, { mocks });
  return {
    result: () => current,
    changeVariables: (variables: ListVariables) => changeVariables(variables),
  };
}

describe("usePagedList", () => {
  it("is loading first, then returns the rows and the total of the backend", async () => {
    const { result } = setup([itemsMock([item("1"), item("2")], { total: 12 })]);

    expect(result().loading).toBe(true);
    await waitFor(() => expect(result().loading).toBe(false));

    expect(result().items.map((row) => row.id)).toEqual(["1", "2"]);
    expect(result().total).toBe(12);
    expect(result().failed).toBe(false);
  });

  it("keeps the total of the last page while the next page loads", async () => {
    const { result, changeVariables } = setup([
      itemsMock([item("1")], { total: 12 }),
      itemsMock([item("11")], { variables: secondPage, total: 12, delay: 300 }),
    ]);
    await waitFor(() => expect(result().loading).toBe(false));

    act(() => changeVariables(secondPage));

    await waitFor(() => expect(result().loading).toBe(true));
    expect(result().total).toBe(12);
    await waitFor(() => expect(result().items.map((row) => row.id)).toEqual(["11"]));
  });

  it("reports a failed request and returns no rows", async () => {
    const { result } = setup([itemsErrorMock()]);

    await waitFor(() => expect(result().failed).toBe(true));

    expect(result().items).toEqual([]);
    expect(result().total).toBe(0);
  });

  it("sends the same request again on retry", async () => {
    const { result } = setup([itemsErrorMock(), itemsMock([item("1")])]);
    await waitFor(() => expect(result().failed).toBe(true));

    act(() => result().retry());

    await waitFor(() => expect(result().failed).toBe(false));
    expect(result().items).toHaveLength(1);
  });
});
