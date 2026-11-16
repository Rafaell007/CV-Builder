import type { MockLink } from "@apollo/client/testing";
import { CvPreviewDocument } from "@/shared/graphql";
import type { CvPreviewData } from "../cvs.types";

// Mock data for tests and stories. The page itself never uses it: all CV data comes from the backend.

/** A full CV preview: two skill groups (one skill without experience) and two projects (one without roles and responsibilities). */
export const cvPreviewSample: CvPreviewData = {
  __typename: "CvPreview",
  cvId: "cv-1",
  name: "Frontend Developer",
  description: "Builds web applications with React and TypeScript.",
  education: "MSc Computer Science",
  fullName: "Anna Kowalska",
  position: "Frontend Developer",
  domains: ["Fintech", "E-commerce"],
  languages: [
    { __typename: "CvPreviewLanguage", name: "English", proficiency: "C1" },
    { __typename: "CvPreviewLanguage", name: "Polish", proficiency: "NATIVE" },
  ],
  skillGroups: [
    {
      __typename: "CvPreviewSkillGroup",
      category: "Frontend",
      skills: [
        {
          __typename: "CvPreviewSkill",
          name: "React",
          mastery: "EXPERT",
          experienceYears: 5,
          lastUsedYear: 2026,
        },
        {
          __typename: "CvPreviewSkill",
          name: "CSS",
          mastery: "ADVANCED",
          experienceYears: 6,
          lastUsedYear: 2026,
        },
      ],
    },
    {
      __typename: "CvPreviewSkillGroup",
      category: "Backend",
      skills: [
        {
          __typename: "CvPreviewSkill",
          name: "GraphQL",
          mastery: "BEGINNER",
          experienceYears: null,
          lastUsedYear: null,
        },
      ],
    },
  ],
  projects: [
    {
      __typename: "CvPreviewProject",
      name: "Banking Portal",
      description: "A web portal for retail banking customers.",
      domain: "Fintech",
      period: "Jan 2022 - Present",
      startDate: "2022-01-01T00:00:00.000Z",
      endDate: null,
      roles: ["Frontend Developer", "Team Lead"],
      responsibilities: "Built the account pages and led code reviews.",
      environment: ["React", "TypeScript"],
    },
    {
      __typename: "CvPreviewProject",
      name: "Online Shop",
      description: "A web shop for consumer electronics.",
      domain: "E-commerce",
      period: "Mar 2020 - Dec 2021",
      startDate: "2020-03-01T00:00:00.000Z",
      endDate: "2021-12-31T00:00:00.000Z",
      roles: [],
      responsibilities: null,
      environment: ["Next.js"],
    },
  ],
};

/** MockedProvider response of the `CvPreview` query for the CV with this id. */
export const cvPreviewMock = (
  preview: CvPreviewData = cvPreviewSample,
): MockLink.MockedResponse => ({
  request: { query: CvPreviewDocument, variables: { cvId: preview.cvId } },
  result: { data: { cvPreview: preview } },
});

/** The backend answers the `CvPreview` query with a GraphQL error code, e.g. `NOT_FOUND` or `FORBIDDEN`. */
export const cvPreviewCodeErrorMock = (cvId: string, code: string): MockLink.MockedResponse => ({
  request: { query: CvPreviewDocument, variables: { cvId } },
  result: { errors: [{ message: code, extensions: { code } }] },
});

/** The `CvPreview` query is refused with `FORBIDDEN`. */
export const cvPreviewForbiddenMock = (cvId: string): MockLink.MockedResponse =>
  cvPreviewCodeErrorMock(cvId, "FORBIDDEN");

/** The `CvPreview` query fails like a network error (no GraphQL error code). */
export const cvPreviewErrorMock = (cvId: string): MockLink.MockedResponse => ({
  request: { query: CvPreviewDocument, variables: { cvId } },
  error: new Error("Failed to fetch"),
});
