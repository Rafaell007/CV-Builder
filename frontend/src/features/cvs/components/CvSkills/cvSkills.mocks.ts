import type { MockLink } from "@apollo/client/testing";
import {
  AddCvSkillDocument,
  AvailableCvSkillsDocument,
  CvSkillsDocument,
  RemoveCvSkillsDocument,
  UpdateCvSkillDocument,
} from "@/shared/graphql";
import type { AvailableCvSkillItem, CvSkillItem, CvSkillMastery } from "./cvSkills.types";

// Mock data for tests and stories. The page itself never uses it: all CV skills come from the backend.

export const CV_ID = "cv-1";

/** A skill category as the backend returns it. */
export const category = (id: string, name: string) =>
  ({ __typename: "SkillCategory", id, name }) as const;

/** One skill of the CV; pass the fields that matter for the test. */
export function cvSkill(overrides: Partial<CvSkillItem> = {}): CvSkillItem {
  return {
    __typename: "CvSkill",
    id: "link-1",
    cvId: CV_ID,
    skillId: "skill-1",
    name: "TypeScript",
    mastery: "ADVANCED",
    category: { __typename: "SkillCategory", id: "category-1", name: "Programming languages" },
    ...overrides,
  };
}

/** One skill the owner has and the CV does not. */
export function availableSkill(
  overrides: Partial<AvailableCvSkillItem> = {},
): AvailableCvSkillItem {
  return {
    __typename: "AvailableCvSkill",
    id: "skill-9",
    name: "Docker",
    mastery: "INTERMEDIATE",
    category: { __typename: "SkillCategory", id: "category-3", name: "DevOps" },
    ...overrides,
  };
}

/** A CV with two categories, in the order the backend sends them (category name, then skill name). */
export const sampleSkills: CvSkillItem[] = [
  cvSkill({
    id: "link-1",
    skillId: "skill-1",
    name: "JavaScript",
    mastery: "EXPERT",
    category: { __typename: "SkillCategory", id: "category-1", name: "Programming languages" },
  }),
  cvSkill({
    id: "link-2",
    skillId: "skill-2",
    name: "TypeScript",
    mastery: "ADVANCED",
    category: { __typename: "SkillCategory", id: "category-1", name: "Programming languages" },
  }),
  cvSkill({
    id: "link-3",
    skillId: "skill-3",
    name: "React",
    mastery: "INTERMEDIATE",
    category: { __typename: "SkillCategory", id: "category-2", name: "Frontend" },
  }),
];

/** MockedProvider response of the `CvSkills` query. */
export const cvSkillsMock = (
  skills: CvSkillItem[] = sampleSkills,
  cvId = CV_ID,
): MockLink.MockedResponse => ({
  request: { query: CvSkillsDocument, variables: { cvId } },
  result: { data: { cvSkills: skills } },
});

/** The `CvSkills` query fails like a network error. */
export const cvSkillsNetworkErrorMock = (cvId = CV_ID): MockLink.MockedResponse => ({
  request: { query: CvSkillsDocument, variables: { cvId } },
  error: new Error("Failed to fetch"),
});

/** MockedProvider response of the `AvailableCvSkills` query. */
export const availableCvSkillsMock = (
  skills: AvailableCvSkillItem[] = [availableSkill()],
  cvId = CV_ID,
): MockLink.MockedResponse => ({
  request: { query: AvailableCvSkillsDocument, variables: { cvId } },
  result: { data: { availableCvSkills: skills } },
});

/** The `AvailableCvSkills` query fails like a network error. */
export const availableCvSkillsNetworkErrorMock = (cvId = CV_ID): MockLink.MockedResponse => ({
  request: { query: AvailableCvSkillsDocument, variables: { cvId } },
  error: new Error("Failed to fetch"),
});

/**
 * MockedProvider response of `addCvSkill`. The backend copies the owner's level when no mastery is sent. With a
 * `mastery`, the request must carry it and the answer has it.
 */
export const addCvSkillMock = (
  skill: AvailableCvSkillItem,
  cvId = CV_ID,
  mastery?: CvSkillMastery,
): MockLink.MockedResponse => ({
  request: {
    query: AddCvSkillDocument,
    variables: { input: { cvId, skillId: skill.id, ...(mastery && { mastery }) } },
  },
  result: {
    data: {
      addCvSkill: cvSkill({
        id: "link-new",
        skillId: skill.id,
        name: skill.name,
        mastery: mastery ?? skill.mastery,
        category: skill.category,
      }),
    },
  },
});

/** `addCvSkill` refused with a GraphQL error code, for example `CONFLICT` or `BAD_USER_INPUT`. */
export const addCvSkillRefusedMock = (
  skillId: string,
  code: string,
  cvId = CV_ID,
): MockLink.MockedResponse => ({
  request: { query: AddCvSkillDocument, variables: { input: { cvId, skillId } } },
  result: { errors: [{ message: code, extensions: { code } }] },
});

/** `addCvSkill` that fails before the backend answers. */
export const addCvSkillNetworkErrorMock = (
  skillId: string,
  cvId = CV_ID,
): MockLink.MockedResponse => ({
  request: { query: AddCvSkillDocument, variables: { input: { cvId, skillId } } },
  error: new Error("Failed to fetch"),
});

/** MockedProvider response of `updateCvSkill`: the skill with its new mastery. */
export const updateCvSkillMock = (
  skill: CvSkillItem,
  mastery: CvSkillMastery,
): MockLink.MockedResponse => ({
  request: { query: UpdateCvSkillDocument, variables: { input: { id: skill.id, mastery } } },
  result: { data: { updateCvSkill: { ...skill, mastery } } },
});

/** `updateCvSkill` refused with a GraphQL error code. */
export const updateCvSkillRefusedMock = (
  id: string,
  mastery: CvSkillMastery,
  code: string,
): MockLink.MockedResponse => ({
  request: { query: UpdateCvSkillDocument, variables: { input: { id, mastery } } },
  result: { errors: [{ message: code, extensions: { code } }] },
});

/** `updateCvSkill` that fails before the backend answers. */
export const updateCvSkillNetworkErrorMock = (
  id: string,
  mastery: CvSkillMastery,
): MockLink.MockedResponse => ({
  request: { query: UpdateCvSkillDocument, variables: { input: { id, mastery } } },
  error: new Error("Failed to fetch"),
});

/** MockedProvider response of `removeCvSkills` for these link ids. */
export const removeCvSkillsMock = (ids: string[], cvId = CV_ID): MockLink.MockedResponse => ({
  request: { query: RemoveCvSkillsDocument, variables: { input: { cvId, ids } } },
  result: { data: { removeCvSkills: true } },
});

/** `removeCvSkills` refused with a GraphQL error code. */
export const removeCvSkillsRefusedMock = (
  ids: string[],
  code: string,
  cvId = CV_ID,
): MockLink.MockedResponse => ({
  request: { query: RemoveCvSkillsDocument, variables: { input: { cvId, ids } } },
  result: { errors: [{ message: code, extensions: { code } }] },
});

/** `removeCvSkills` that fails before the backend answers. */
export const removeCvSkillsNetworkErrorMock = (
  ids: string[],
  cvId = CV_ID,
): MockLink.MockedResponse => ({
  request: { query: RemoveCvSkillsDocument, variables: { input: { cvId, ids } } },
  error: new Error("Failed to fetch"),
});
