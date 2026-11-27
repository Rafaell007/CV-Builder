export const DEPARTMENTS = [
  "Engineering",
  "Design",
  "Quality Assurance",
  "Data & Analytics",
  "Product",
  "Human Resources",
];

export const POSITIONS = [
  "Frontend Developer",
  "Backend Developer",
  "Fullstack Developer",
  "QA Engineer",
  "UI/UX Designer",
  "DevOps Engineer",
  "Project Manager",
  "Business Analyst",
];

export const PROJECT_ROLES = [
  "Developer",
  "Team Lead",
  "Tech Lead",
  "QA Engineer",
  "Business Analyst",
  "Project Manager",
  "UI/UX Designer",
  "DevOps Engineer",
];

interface SkillCategorySeed {
  name: string;
  type: string;
  skills: string[];
}

export const SKILL_CATEGORIES: SkillCategorySeed[] = [
  {
    name: "Programming Languages",
    type: "Language",
    skills: ["TypeScript", "JavaScript", "Python", "Java", "C#", "Go", "SQL"],
  },
  {
    name: "Frontend",
    type: "Technology",
    skills: ["React", "Next.js", "Vue.js", "Angular", "HTML", "CSS", "Redux"],
  },
  {
    name: "Backend",
    type: "Technology",
    skills: ["NestJS", "Node.js", "Express", "Spring Boot", "Django", "GraphQL"],
  },
  {
    name: "Databases",
    type: "Technology",
    skills: ["PostgreSQL", "MySQL", "MongoDB", "Redis", "Prisma"],
  },
  {
    name: "DevOps & Cloud",
    type: "Tool",
    skills: ["Docker", "Kubernetes", "AWS", "GitHub Actions", "Terraform", "Linux"],
  },
  {
    name: "Testing",
    type: "Tool",
    skills: ["Jest", "Playwright", "Cypress", "Vitest", "Selenium"],
  },
  {
    name: "Soft Skills",
    type: "Soft skill",
    skills: ["Communication", "Teamwork", "Leadership", "Problem Solving", "Time Management"],
  },
];

interface LanguageSeed {
  name: string;
  iso: string;
  nativeName: string;
}

export const LANGUAGES: LanguageSeed[] = [
  { name: "English", iso: "EN", nativeName: "English" },
  { name: "Polish", iso: "PL", nativeName: "Polski" },
  { name: "German", iso: "DE", nativeName: "Deutsch" },
  { name: "French", iso: "FR", nativeName: "Français" },
  { name: "Spanish", iso: "ES", nativeName: "Español" },
  { name: "Italian", iso: "IT", nativeName: "Italiano" },
  { name: "Ukrainian", iso: "UK", nativeName: "Українська" },
  { name: "Russian", iso: "RU", nativeName: "Русский" },
  { name: "Czech", iso: "CS", nativeName: "Čeština" },
  { name: "Portuguese", iso: "PT", nativeName: "Português" },
  { name: "Japanese", iso: "JA", nativeName: "日本語" },
  { name: "Chinese", iso: "ZH", nativeName: "中文" },
];
