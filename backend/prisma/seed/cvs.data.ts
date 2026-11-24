import { SEED_EMAILS } from "./credentials";

interface CvProjectSeed {
  project: string;
  // Within the project's own dates (D25).
  startDate: string;
  endDate: string | null;
  responsibilities: string;
  roles: string[];
}

interface CvSeed {
  ownerEmail: string;
  name: string;
  education: string;
  description: string;
  // Must be skills the owner has (see users.data.ts); the mastery is copied from them.
  skills: string[];
  projects: CvProjectSeed[];
}

export const CVS: CvSeed[] = [
  {
    ownerEmail: SEED_EMAILS.user1,
    name: "Frontend Developer",
    education: "BSc Computer Science, Warsaw University of Technology",
    description:
      "Frontend developer with five years of experience building React and Next.js applications. Cares about accessibility and maintainable component code.",
    skills: ["TypeScript", "React", "Next.js", "Redux", "CSS", "Jest"],
    projects: [
      {
        project: "Banking Portal",
        startDate: "2022-03-01",
        endDate: "2023-06-30",
        responsibilities:
          "Built the accounts overview and transfer screens; introduced a shared component library.",
        roles: ["Developer"],
      },
      {
        project: "E-commerce Marketplace",
        startDate: "2023-09-01",
        endDate: "2024-05-31",
        responsibilities: "Led the storefront team; owned search, cart and checkout pages.",
        roles: ["Developer", "Team Lead"],
      },
      // Seven more projects, so this CV has nine (a long CV for the PDF and the preview pages).
      {
        project: "Travel Booking App",
        startDate: "2020-09-01",
        endDate: "2021-12-31",
        responsibilities:
          "Built the search form and the price comparison list; covered the booking steps with Jest tests.",
        roles: ["Developer"],
      },
      {
        project: "Hospital Appointment System",
        startDate: "2021-03-01",
        endDate: "2021-11-30",
        responsibilities: "Made the Angular booking calendar and the reminder settings screens.",
        roles: ["Developer"],
      },
      {
        project: "Real Estate Listings Portal",
        startDate: "2021-02-01",
        endDate: "2022-04-30",
        responsibilities:
          "Implemented the listing page and the map search with saved filters; improved the page load time.",
        roles: ["Developer"],
      },
      {
        project: "Energy Usage Monitor",
        startDate: "2022-05-01",
        endDate: "2023-10-31",
        responsibilities:
          "Created the usage charts and the monthly report view; introduced Redux for the filter state.",
        roles: ["Developer", "Tech Lead"],
      },
      {
        project: "Media Streaming Platform",
        startDate: "2023-01-01",
        endDate: "2024-02-29",
        responsibilities:
          "Built the web player and the playlist screens; wrote the Playwright tests for playback.",
        roles: ["Developer"],
      },
      {
        project: "Logistics Tracking Dashboard",
        startDate: "2024-06-01",
        endDate: "2025-03-31",
        responsibilities:
          "Added the shipment map, the delay alerts and the export of the dispatcher list.",
        roles: ["Developer", "Team Lead"],
      },
      {
        project: "Learning Management Platform",
        startDate: "2025-01-01",
        endDate: null,
        responsibilities:
          "Builds the course player and the progress pages; keeps the component library in sync with the design.",
        roles: ["Developer"],
      },
    ],
  },
  {
    ownerEmail: SEED_EMAILS.user1,
    name: "Fullstack Developer (draft)",
    education: "BSc Computer Science, Warsaw University of Technology",
    description: "Work in progress: a fullstack version of the profile, no projects added yet.",
    skills: ["TypeScript", "JavaScript"],
    projects: [],
  },
  {
    ownerEmail: SEED_EMAILS.user2,
    name: "Backend Developer",
    education: "MSc Software Engineering, AGH University of Krakow",
    description:
      "Backend developer focused on Node.js, GraphQL and PostgreSQL. Enjoys designing clear APIs and reliable data models.",
    skills: ["TypeScript", "Node.js", "NestJS", "GraphQL", "PostgreSQL", "Docker"],
    projects: [
      {
        project: "Banking Portal",
        startDate: "2022-01-10",
        endDate: "2022-12-31",
        responsibilities:
          "Designed the transfers API and the audit log; wrote the database migrations.",
        roles: ["Developer"],
      },
      {
        project: "E-commerce Marketplace",
        startDate: "2023-02-01",
        endDate: "2024-05-31",
        responsibilities:
          "Technical lead of the GraphQL API; reviewed code and set the testing strategy.",
        roles: ["Tech Lead", "Developer"],
      },
    ],
  },
  {
    ownerEmail: SEED_EMAILS.user3,
    name: "QA Engineer",
    education: "BSc Information Systems, University of Gdansk",
    description:
      "QA engineer who automates regression testing end to end and works closely with developers from the first sprint.",
    skills: ["Playwright", "Cypress", "Selenium", "Jest", "SQL"],
    projects: [
      {
        project: "Logistics Tracking Dashboard",
        startDate: "2024-01-15",
        endDate: "2025-03-31",
        responsibilities:
          "Wrote the Playwright suite for the dispatcher flows and ran release regressions.",
        roles: ["QA Engineer"],
      },
      {
        project: "Learning Management Platform",
        startDate: "2024-04-01",
        endDate: "2025-06-30",
        responsibilities:
          "Planned test cases for quizzes and certificates; reported and verified defects.",
        roles: ["QA Engineer"],
      },
    ],
  },
  {
    ownerEmail: SEED_EMAILS.admin,
    name: "Project Manager",
    education: "MBA, Warsaw School of Economics",
    description:
      "Project manager with a business analysis background, running delivery for web platforms from discovery to release.",
    skills: ["Communication", "Leadership", "Time Management", "Teamwork"],
    projects: [
      {
        project: "Learning Management Platform",
        startDate: "2024-04-01",
        endDate: "2025-09-30",
        responsibilities: "Managed scope, budget and the release plan for two universities.",
        roles: ["Project Manager"],
      },
      {
        project: "Travel Booking App",
        startDate: "2020-06-01",
        endDate: "2021-12-31",
        responsibilities: "Gathered requirements from the providers and prioritised the backlog.",
        roles: ["Business Analyst", "Project Manager"],
      },
    ],
  },
];
