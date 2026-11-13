/**
 * The part of a CV project the preview calculations need. The dates are the CV-specific dates
 * (whole days, UTC). An `endDate` of `null` means the project is still active ("Present").
 */
export interface PreviewProject {
  skillIds: string[];
  domain: string;
  startDate: Date;
  endDate: Date | null;
}
