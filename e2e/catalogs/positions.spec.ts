import { describeCatalogPage } from "../support/catalogPage";

// The shared catalog tests (support/catalogPage.ts) with the Positions seed (backend/prisma/seed/catalogs.data.ts).
describeCatalogPage({
  catalog: "position",
  path: "/admin/positions",
  title: "Positions",
  singular: "Position",
  polishTitle: "Stanowiska",
  seed: [
    "Backend Developer",
    "Business Analyst",
    "DevOps Engineer",
    "Frontend Developer",
    "Fullstack Developer",
    "Project Manager",
    "QA Engineer",
    "UI/UX Designer",
  ],
  // A seed user is a Frontend Developer (backend/prisma/seed/users.data.ts).
  inUse: "Frontend Developer",
  search: { text: "devops", finds: "DevOps Engineer" },
});
