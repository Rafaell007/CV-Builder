import type { ApolloClient } from "@apollo/client";
import { useApolloClient } from "@apollo/client/react";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { EnvironmentOptionsDocument } from "@/shared/graphql";
import { readFailure } from "@/shared/failures";
import { renderWithProviders, type RenderWithProvidersOptions } from "@/shared/testing";
import {
  deleteSkillMock as deleteMock,
  deleteSkillRefusedMock as refusedMock,
} from "../skills.mocks";
import { useDeleteSkill } from "./useDeleteSkill";

// renderWithProviders renders elements; this small component lets the hook run inside the same providers.
function setup(options: RenderWithProvidersOptions) {
  let current!: ReturnType<typeof useDeleteSkill>;
  let client!: ApolloClient;
  function Probe(): ReactNode {
    current = useDeleteSkill();
    client = useApolloClient();
    return null;
  }
  renderWithProviders(<Probe />, options);
  return { result: () => current, client: () => client };
}

describe("useDeleteSkill", () => {
  it("resolves when the skill was deleted", async () => {
    const { result } = setup({ mocks: [deleteMock("7")] });

    await expect(result().remove("7")).resolves.toBeUndefined();
  });

  it("rejects with the CONFLICT error of a skill in use", async () => {
    const { result } = setup({ mocks: [refusedMock("7")] });

    const error = await result()
      .remove("7")
      .catch((caught: unknown) => caught);

    expect(readFailure(error).kind).toBe("conflict");
  });

  it("forgets the cached skills of the Environment field when it deletes a skill", async () => {
    const { result, client } = setup({ mocks: [deleteMock("7")] });
    client().writeQuery({
      query: EnvironmentOptionsDocument,
      data: { skills: [{ __typename: "EnvironmentSkill", id: "9", name: "Go" }] },
    });

    await result().remove("7");

    expect(client().readQuery({ query: EnvironmentOptionsDocument })).toBeNull();
  });
});
