import type { CvLocale } from "../cv-locale";

/** Every fixed text of the PDF (the open-period word is in `cv-locale.ts`, because the preview uses it too). The content of the CV (names, descriptions, skills) is never translated. */
export interface PdfLabels {
  generalInformation: string;
  education: string;
  languages: string;
  /** The proficiency level `NATIVE`. The levels A1 to C2 are printed as they are. */
  levelNative: string;
  domains: string;
  summary: string;
  skills: string;
  projects: string;
  role: string;
  period: string;
  responsibilities: string;
  environment: string;
  professionalSkills: string;
  columnCategory: string;
  columnSkill: string;
  columnExperience: string;
  columnLastUsed: string;
}

// The Polish texts follow the preview page (`frontend/src/features/cvs/messages/pl.json`, `cvs.preview`).
const LABELS: Record<CvLocale, PdfLabels> = {
  en: {
    generalInformation: "General information",
    education: "Education",
    languages: "Language proficiency",
    levelNative: "Native",
    domains: "Domains",
    summary: "Summary",
    skills: "Skills",
    projects: "Projects",
    role: "Role",
    period: "Period",
    responsibilities: "Responsibilities",
    environment: "Environment",
    professionalSkills: "Professional skills",
    columnCategory: "Skills Category",
    columnSkill: "Skill",
    columnExperience: "Experience in Years",
    columnLastUsed: "Last Used",
  },
  pl: {
    generalInformation: "Informacje ogólne",
    education: "Wykształcenie",
    languages: "Znajomość języków",
    levelNative: "Ojczysty",
    domains: "Branże",
    summary: "Podsumowanie",
    skills: "Umiejętności",
    projects: "Projekty",
    role: "Rola",
    period: "Okres",
    responsibilities: "Obowiązki",
    environment: "Środowisko",
    professionalSkills: "Umiejętności zawodowe",
    columnCategory: "Kategoria umiejętności",
    columnSkill: "Umiejętność",
    columnExperience: "Doświadczenie w latach",
    columnLastUsed: "Ostatnio używana",
  },
};

export function pdfLabels(locale: CvLocale): PdfLabels {
  return LABELS[locale];
}
