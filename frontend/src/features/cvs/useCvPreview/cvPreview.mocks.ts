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
          experienceYears: 5,
          lastUsedYear: 2026,
        },
        {
          __typename: "CvPreviewSkill",
          name: "CSS",
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
      period: "01.2022 – Till now",
      roles: ["Frontend Developer", "Team Lead"],
      responsibilities: "Built the account pages and led code reviews.",
      environment: ["React", "TypeScript"],
    },
    {
      __typename: "CvPreviewProject",
      name: "Online Shop",
      description: "A web shop for consumer electronics.",
      period: "03.2020 – 12.2021",
      roles: [],
      responsibilities: null,
      environment: ["Next.js"],
    },
  ],
};

/**
 * A CV preview with the content and the lengths of the Figma frames (desktop frame 41, tablet frame 32): a long
 * summary, one project with five responsibilities, and five skills in four categories. For stories that are
 * compared with the design. Languages are empty there too. Tests use `cvPreviewSample`.
 */
export const cvPreviewFigmaSample: CvPreviewData = {
  __typename: "CvPreview",
  cvId: "cv-1",
  name: "Software Engineer with 5+ years of experience",
  description:
    "Highly motivated and experienced Software Engineer with 5+ years of proven success in designing and developing complex software solutions. Adept at utilizing cutting-edge technologies such as React and Node.js to create user-friendly and scalable applications. Possesses a strong understanding of Computer Systems Design principles and methodologies. A results-oriented individual with a passion for delivering high-quality work and exceeding expectations. A strong team leader and mentor with a proven ability to guide and motivate others to achieve shared goals. Seeking a challenging and rewarding Software Engineer position where I can leverage my skills and experience to contribute to the success of a dynamic and innovative organization.",
  education: "Computer Systems Design",
  fullName: "Rostislav Harlanov",
  position: "Software Engineer",
  domains: ["IoT (Internet of Things)"],
  languages: [],
  skillGroups: [
    {
      __typename: "CvPreviewSkillGroup",
      category: "Programming languages",
      skills: [
        {
          __typename: "CvPreviewSkill",
          name: "TypeScript",
          experienceYears: 2,
          lastUsedYear: 2025,
        },
        {
          __typename: "CvPreviewSkill",
          name: "JavaScript",
          experienceYears: 2,
          lastUsedYear: 2025,
        },
      ],
    },
    {
      __typename: "CvPreviewSkillGroup",
      category: "Frontend technologies",
      skills: [
        {
          __typename: "CvPreviewSkill",
          name: "React",
          experienceYears: 2,
          lastUsedYear: 2025,
        },
      ],
    },
    {
      __typename: "CvPreviewSkillGroup",
      category: "State management libraries",
      skills: [
        {
          __typename: "CvPreviewSkill",
          name: "Redux",
          experienceYears: 2,
          lastUsedYear: 2025,
        },
      ],
    },
    {
      __typename: "CvPreviewSkillGroup",
      category: "Backend technologies",
      skills: [
        {
          __typename: "CvPreviewSkill",
          name: "gRPC",
          experienceYears: 2,
          lastUsedYear: 2025,
        },
      ],
    },
  ],
  projects: [
    {
      __typename: "CvPreviewProject",
      name: "SaaS Media Platform",
      description:
        "A digital music, podcast, and video service that gives you access to millions of songs and other content from creators all over the world. The user can connect and manage service providers such as Spotify, Apple Music, Tidal and SoundCloud in a few clicks and play content from them.",
      period: "08.2023 – Till now",
      roles: ["Frontend Developer", "AI Developer"],
      responsibilities: [
        "Integrated Keycloak OAuth SSO login for seamless user authentication;",
        "Developed web components according to the Figma design system to ensure a consistent and modern user interface;",
        "Successfully managed and onboarded both wired and wireless IoT devices, enabling real-time data streaming and control;",
        "Collaborated with the development team to integrate with third-party service providers such as Spotify, Apple Music, and Tidal, enhancing the user experience;",
        "Contributed to the overall success of the project by implementing robust security measures and optimizing performance.",
      ].join("\n"),
      environment: [
        "TypeScript",
        "React",
        "Redux",
        "Redux Toolkit",
        "RTK Query",
        "Radix UI",
        "gRPC",
        "Keycloak",
      ],
    },
  ],
};

/** MockedProvider response of the `CvPreview` query for the CV with this id. `locale` is the language of the page (English at first). */
export const cvPreviewMock = (
  preview: CvPreviewData = cvPreviewSample,
  locale = "en",
): MockLink.MockedResponse => ({
  request: { query: CvPreviewDocument, variables: { cvId: preview.cvId, locale } },
  result: { data: { cvPreview: preview } },
});

/** The backend answers the `CvPreview` query with a GraphQL error code, e.g. `NOT_FOUND` or `FORBIDDEN`. */
export const cvPreviewCodeErrorMock = (
  cvId: string,
  code: string,
  locale = "en",
): MockLink.MockedResponse => ({
  request: { query: CvPreviewDocument, variables: { cvId, locale } },
  result: { errors: [{ message: code, extensions: { code } }] },
});

/** The `CvPreview` query is refused with `FORBIDDEN`. */
export const cvPreviewForbiddenMock = (cvId: string, locale = "en"): MockLink.MockedResponse =>
  cvPreviewCodeErrorMock(cvId, "FORBIDDEN", locale);

/** The `CvPreview` query fails like a network error (no GraphQL error code). */
export const cvPreviewErrorMock = (cvId: string, locale = "en"): MockLink.MockedResponse => ({
  request: { query: CvPreviewDocument, variables: { cvId, locale } },
  error: new Error("Failed to fetch"),
});
