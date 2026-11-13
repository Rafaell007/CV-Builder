"use client";

import type { CvDetailsData } from "../../cvs.types";
import { useCv } from "../../useCv";
import { useCvDetailsForm } from "../../useCvDetailsForm";
import { CvDetailsForm } from "../CvDetailsForm";

export interface CvDetailsProps {
  cvId: string;
}

// Its own component: the form hook needs a CV, and a hook cannot be called after an early return.
function CvDetailsLoaded({ cv }: { cv: CvDetailsData }) {
  return <CvDetailsForm details={useCvDetailsForm(cv)} />;
}

/**
 * The content of the Details tab: the form with the data of the CV. `CvLayout` shows this page only after the
 * backend returned the CV, so the request here is answered from the Apollo cache and sends nothing new.
 */
export function CvDetails({ cvId }: CvDetailsProps) {
  const { cv } = useCv(cvId);

  if (!cv) return null;
  return <CvDetailsLoaded cv={cv} />;
}
