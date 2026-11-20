import type { ApolloClient } from "@apollo/client";
import { useApolloClient } from "@apollo/client/react";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { EnvironmentOptionsDocument } from "@/shared/graphql";
import { renderWithProviders, type RenderWithProvidersOptions } from "@/shared/testing";
import { isCatalogConflict } from "../../../utils";
import {
  databasesCategory,
  updateSkillMock as updateMock,
  updateSkillRefusedMock as refusedMock,
} from "../skills.mocks";
import { useUpdateSkill } from "./useUpdateSkill";

// renderWithProviders renders elements; this small component lets the hook run inside the same providers.
function setup(options: RenderWithProvidersOptions) {
  let current!: ReturnType<typeof useUpdateSkill>;
  let client!: ApolloClient;
  function Probe(): ReactNode {
    current = useUpdateSkill();
    client = useApolloClient();
    return null;
  }
  renderWithProviders(<Probe />, options);
  return { result: () => current, client: () => client };
}

const input = { name: "React.js", categoryId: databasesCategory.id };

describe("useUpdateSkill", () => {
  it("sends the id, the name and the category, and resolves with the saved skill", async () => {
    const { result } = setup({ mocks: [updateMock("1", input)] });

    await expect(result().update("1", input)).resolves.toMatchObject({
      id: "1",
      name: "React.js",
      category: { id: databasesCategory.id },
    });
  });

  it("rejects with the CONFLICT error of a name another skill has", async () => {
    const { result } = setup({ mocks: [refusedMock("1", input)] });

    const error = await result()
      .update("1", input)
      .catch((caught: unknown) => caught);

    expect(isCatalogConflict(error)).toBe(true);
  });

  it("forgets the cached skills of the Environment field when it updates a skill", async () => {
    const { result, client } = setup({ mocks: [updateMock("1", input)] });
    client().writeQuery({
      query: EnvironmentOptionsDocument,
      data: { skills: [{ __typename: "EnvironmentSkill", id: "9", name: "Go" }] },
    });

    await result().update("1", input);

    expect(client().readQuery({ query: EnvironmentOptionsDocument })).toBeNull();
  });
});
