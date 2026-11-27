interface ProjectSeed {
  name: string;
  domain: string;
  startDate: string;
  endDate: string;
  description: string;
  skills: string[];
}

// Dates are ISO days: the columns are `date`, and CV projects must stay inside these ranges (D25).
export const PROJECTS: ProjectSeed[] = [
  {
    name: "Banking Portal",
    domain: "Finance",
    startDate: "2022-01-10",
    endDate: "2023-06-30",
    description:
      "Customer web portal for a retail bank: accounts overview, transfers and statements, with strong requirements on security and audit.",
    skills: ["TypeScript", "React", "Redux", "NestJS", "PostgreSQL", "Docker"],
  },
  {
    name: "Hospital Appointment System",
    domain: "Healthcare",
    startDate: "2021-03-01",
    endDate: "2022-02-28",
    description:
      "Booking system for a hospital network: doctors' calendars, patient reminders and an administrative back office.",
    skills: ["Java", "Spring Boot", "MySQL", "Angular", "Selenium"],
  },
  {
    name: "E-commerce Marketplace",
    domain: "Retail",
    startDate: "2023-02-01",
    endDate: "2024-05-31",
    description:
      "Multi-vendor marketplace with search, cart and checkout, built as a Next.js storefront on top of a GraphQL API.",
    skills: ["TypeScript", "Next.js", "GraphQL", "Node.js", "MongoDB", "Cypress", "AWS"],
  },
  {
    name: "Logistics Tracking Dashboard",
    domain: "Logistics",
    startDate: "2023-09-01",
    endDate: "2025-03-31",
    description:
      "Live dashboard for tracking shipments and fleet status, with alerts for delays and exports for dispatchers.",
    skills: ["TypeScript", "React", "Express", "PostgreSQL", "Redis", "Kubernetes", "Playwright"],
  },
  {
    name: "Learning Management Platform",
    domain: "Education",
    startDate: "2024-04-01",
    endDate: "2025-09-30",
    description:
      "Platform for online courses: lessons, quizzes, progress tracking and certificates for universities and companies.",
    skills: ["Python", "Django", "PostgreSQL", "Vue.js", "Docker", "GitHub Actions"],
  },
  {
    name: "Travel Booking App",
    domain: "Travel",
    startDate: "2020-06-01",
    endDate: "2021-12-31",
    description:
      "Mobile-first web app for booking flights and hotels with price comparison across several providers.",
    skills: ["JavaScript", "React", "Node.js", "MongoDB", "Jest"],
  },
  {
    name: "Real Estate Listings Portal",
    domain: "Real Estate",
    startDate: "2021-02-01",
    endDate: "2022-04-30",
    description:
      "Portal for publishing and searching property listings, with map search, saved filters and email alerts for new offers.",
    skills: ["TypeScript", "React", "Next.js", "GraphQL"],
  },
  {
    name: "Energy Usage Monitor",
    domain: "Energy",
    startDate: "2022-05-01",
    endDate: "2023-10-31",
    description:
      "Web application that shows the energy use of buildings in charts, with monthly reports and alerts for unusual consumption.",
    skills: ["TypeScript", "React", "Redux", "Jest"],
  },
  {
    name: "Media Streaming Platform",
    domain: "Media",
    startDate: "2023-01-01",
    endDate: "2024-02-29",
    description:
      "Streaming service for music and podcasts: playlists, offline mode, recommendations and a web player shared with the mobile apps.",
    skills: ["TypeScript", "React", "Next.js", "Playwright"],
  },
];
