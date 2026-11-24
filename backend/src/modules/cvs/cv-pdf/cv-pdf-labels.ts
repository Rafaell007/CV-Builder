import type { CvLocale } from "../cv-locale";

/** Every fixed text of the PDF (the open-period word is in `cv-locale.ts`, because the preview uses it too). The content of the CV (names, descriptions, skills) is never translated. */
export interface PdfLabels {
  education: string;
  languages: string;
  /** The proficiency level `NATIVE`. The levels A1 to C2 are printed as they are. */
  levelNative: string;
  domains: string;
  projects: string;
  roles: string;
  period: string;
  responsibilities: string;
  environment: string;
  professionalSkills: string;
  columnSkills: string;
  columnExperience: string;
  columnLastUsed: string;
}

// The Polish texts follow the preview page (`frontend/src/features/cvs/messages/pl.json`, `cvs.preview`).
const LABELS: Record<CvLocale, PdfLabels> = {
  en: {
    education: "Education",
    languages: "Language proficiency",
    levelNative: "Native",
    domains: "Domains",
    projects: "Projects",
    roles: "Project roles",
    period: "Period",
    responsibilities: "Responsibilities",
    environment: "Environment",
    professionalSkills: "Professional skills",
    columnSkills: "Skills",
    columnExperience: "Experience in Years",
    columnLastUsed: "Last Used",
  },
  pl: {
    education: "Wykształcenie",
    languages: "Znajomość języków",
    levelNative: "Ojczysty",
    domains: "Branże",
    projects: "Projekty",
    roles: "Role w projekcie",
    period: "Okres",
    responsibilities: "Obowiązki",
    environment: "Środowisko",
    professionalSkills: "Umiejętności zawodowe",
    columnSkills: "Umiejętności",
    columnExperience: "Doświadczenie w latach",
    columnLastUsed: "Ostatnio używana",
  },
};

export function pdfLabels(locale: CvLocale): PdfLabels {
  return LABELS[locale];
}
