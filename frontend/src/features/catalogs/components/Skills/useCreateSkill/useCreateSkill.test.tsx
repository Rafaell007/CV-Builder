import type { ApolloClient } from "@apollo/client";
import { useApolloClient } from "@apollo/client/react";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { getServerFieldErrors } from "@/shared/forms";
import { EnvironmentOptionsDocument } from "@/shared/graphql";
import { readFailure } from "@/shared/failures";
import { renderWithProviders, type RenderWithProvidersOptions } from "@/shared/testing";
import {
  createSkillMock as createMock,
  createSkillRefusedMock as refusedMock,
  toolsCategory,
} from "../skills.mocks";
import { useCreateSkill } from "./useCreateSkill";

// renderWithProviders renders elements; this small component lets the hook run inside the same providers.
function setup(options: RenderWithProvidersOptions) {
  let current!: ReturnType<typeof useCreateSkill>;
  let client!: ApolloClient;
  function Probe(): ReactNode {
    current = useCreateSkill();
    client = useApolloClient();
    return null;
  }
  renderWithProviders(<Probe />, options);
  return { result: () => current, client: () => client };
}

const input = { name: "Docker", categoryId: toolsCategory.id };

describe("useCreateSkill", () => {
  it("sends the name and the category, and resolves with the saved skill and its category", async () => {
    const { result } = setup({ mocks: [createMock(input)] });

    await expect(result().create(input)).resolves.toMatchObject({
      id: "new-1",
      name: "Docker",
      category: { id: toolsCategory.id, type: "Tool" },
    });
  });

  it("rejects with the CONFLICT error of a taken name", async () => {
    const { result } = setup({ mocks: [refusedMock(input)] });

    const error = await result()
      .create(input)
      .catch((caught: unknown) => caught);

    expect(readFailure(error).kind).toBe("conflict");
  });

  it("rejects with the categoryId field error of a missing category", async () => {
    const { result } = setup({
      mocks: [
        refusedMock(input, {
          code: "BAD_USER_INPUT",
          message: "Category not found",
          field: "categoryId",
        }),
      ],
    });

    const error = await result()
      .create(input)
      .catch((caught: unknown) => caught);

    expect(getServerFieldErrors(error)).toEqual([
      { field: "categoryId", messages: ["Category not found"] },
    ]);
  });

  it("forgets the cached skills of the Environment field when it creates a skill", async () => {
    const { result, client } = setup({ mocks: [createMock(input)] });
    client().writeQuery({
      query: EnvironmentOptionsDocument,
      data: { skills: [{ __typename: "EnvironmentSkill", id: "9", name: "Go" }] },
    });

    await result().create(input);

    expect(client().readQuery({ query: EnvironmentOptionsDocument })).toBeNull();
  });
});
