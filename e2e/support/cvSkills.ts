import type { BrowserContext } from "@playwright/test";
import { graphql } from "./graphql";

const AVAILABLE = "query Available($cvId: ID!) { availableCvSkills(cvId: $cvId) { id name } }";
const ADD = "mutation AddCvSkill($input: AddCvSkillInput!) { addCvSkill(input: $input) { id } }";

/**
 * Adds skills to a CV through the API, so a spec does not click through the Add skill modal for its set-up. The names
 * must be skills that the owner of the CV has and the CV does not hold yet (the backend refuses any other). The CV goes
 * away with its CV (`deleteCvsByName`), so no clean-up is needed.
 */
export async function addCvSkillsByName(
  context: BrowserContext,
  cvId: string,
  names: string[],
): Promise<void> {
  const { availableCvSkills } = await graphql<{
    availableCvSkills: { id: string; name: string }[];
  }>(context, AVAILABLE, { cvId });
  for (const name of names) {
    const skill = availableCvSkills.find((candidate) => candidate.name === name);
    if (!skill) throw new Error(`The owner of the CV has no available skill named ${name}`);
    await graphql(context, ADD, { input: { cvId, skillId: skill.id } });
  }
}
