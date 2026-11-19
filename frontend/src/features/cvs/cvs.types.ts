import type { CvPreviewQuery, CvQuery, CvsQuery } from "@/shared/graphql";
import type { CV_TABS } from "./cvs.constants";

/** One row of the CVs list, as the `Cvs` query returns it. */
export type CvListItem = CvsQuery["cvs"]["items"][number];

/** The CV of the CV Details page, as the `Cv` query returns it. */
export type CvDetailsData = CvQuery["cv"];

/** The whole CV of the CV Preview page, as the `CvPreview` query returns it. */
export type CvPreviewData = CvPreviewQuery["cvPreview"];

/** What the CV form (Create and Update) holds while the user types. */
export interface CvFormValues {
  name: string;
  education: string;
  description: string;
}

/** One tab of the CV pages. It is also the last part of the route (`/cvs/{id}/details`). */
export type CvTab = (typeof CV_TABS)[number];
