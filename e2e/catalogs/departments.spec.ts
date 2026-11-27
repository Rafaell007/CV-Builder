import { describeCatalogPage } from "../support/catalogPage";

// The shared catalog tests (support/catalogPage.ts) with the Departments seed (backend/prisma/seed/catalogs.data.ts).
describeCatalogPage({
  catalog: "department",
  path: "/admin/departments",
  title: "Departments",
  singular: "Department",
  polishTitle: "Działy",
  seed: [
    "Data & Analytics",
    "Design",
    "Engineering",
    "Human Resources",
    "Product",
    "Quality Assurance",
  ],
  // Seed users work in Engineering (backend/prisma/seed/users.data.ts).
  inUse: "Engineering",
  search: { text: "ENGIN", finds: "Engineering" },
});
