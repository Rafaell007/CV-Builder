import { Mastery, Proficiency, Role } from "../../src/generated/prisma/enums";
import { SEED_EMAILS } from "./credentials";

interface UserSeed {
  email: string;
  role: Role;
  firstName: string;
  lastName: string;
  department: string;
  position: string;
  skills: [skill: string, mastery: Mastery][];
  languages: [language: string, proficiency: Proficiency][];
}

export const USERS: UserSeed[] = [
  {
    email: SEED_EMAILS.admin,
    role: Role.ADMIN,
    firstName: "Ada",
    lastName: "Admin",
    department: "Product",
    position: "Project Manager",
    skills: [
      ["Communication", Mastery.EXPERT],
      ["Leadership", Mastery.ADVANCED],
      ["Time Management", Mastery.ADVANCED],
      ["Teamwork", Mastery.ADVANCED],
      ["SQL", Mastery.ELEMENTARY],
    ],
    languages: [
      ["English", Proficiency.C2],
      ["Polish", Proficiency.NATIVE],
    ],
  },
  {
    email: SEED_EMAILS.user1,
    role: Role.USER,
    firstName: "Jan",
    lastName: "Kowalski",
    department: "Engineering",
    position: "Frontend Developer",
    skills: [
      ["TypeScript", Mastery.ADVANCED],
      ["JavaScript", Mastery.EXPERT],
      ["React", Mastery.EXPERT],
      ["Next.js", Mastery.ADVANCED],
      ["Redux", Mastery.INTERMEDIATE],
      ["HTML", Mastery.EXPERT],
      ["CSS", Mastery.ADVANCED],
      ["Jest", Mastery.INTERMEDIATE],
      ["Playwright", Mastery.BEGINNER],
      ["Teamwork", Mastery.ADVANCED],
    ],
    languages: [
      ["Polish", Proficiency.NATIVE],
      ["English", Proficiency.C1],
      ["German", Proficiency.A2],
    ],
  },
  {
    email: SEED_EMAILS.user2,
    role: Role.USER,
    firstName: "Anna",
    lastName: "Nowak",
    department: "Engineering",
    position: "Backend Developer",
    skills: [
      ["TypeScript", Mastery.ADVANCED],
      ["Node.js", Mastery.EXPERT],
      ["NestJS", Mastery.ADVANCED],
      ["GraphQL", Mastery.ADVANCED],
      ["PostgreSQL", Mastery.ADVANCED],
      ["Prisma", Mastery.INTERMEDIATE],
      ["Docker", Mastery.INTERMEDIATE],
      ["AWS", Mastery.ELEMENTARY],
      ["Problem Solving", Mastery.EXPERT],
    ],
    languages: [
      ["Polish", Proficiency.NATIVE],
      ["English", Proficiency.B2],
      ["French", Proficiency.B1],
    ],
  },
  {
    email: SEED_EMAILS.user3,
    role: Role.USER,
    firstName: "Piotr",
    lastName: "Wiśniewski",
    department: "Quality Assurance",
    position: "QA Engineer",
    skills: [
      ["Playwright", Mastery.EXPERT],
      ["Cypress", Mastery.ADVANCED],
      ["Selenium", Mastery.INTERMEDIATE],
      ["Jest", Mastery.ADVANCED],
      ["JavaScript", Mastery.INTERMEDIATE],
      ["SQL", Mastery.INTERMEDIATE],
      ["Communication", Mastery.ADVANCED],
    ],
    languages: [
      ["Polish", Proficiency.NATIVE],
      ["English", Proficiency.B2],
      ["Spanish", Proficiency.A1],
    ],
  },
];
