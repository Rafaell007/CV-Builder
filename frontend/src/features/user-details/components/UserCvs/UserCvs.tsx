"use client";

import { RequireAdmin } from "@/features/app-shell";
import { Cvs } from "@/features/cvs";

export interface UserCvsProps {
  /** The employee of the open User Details page. It comes from the route, never from a form. */
  userId: string;
}

/**
 * Content of the CVs tab of a user (admin only): the CVs list of that user. Search, sort, create, update and
 * delete are the ones of `Cvs`; a new CV gets this user as the owner. `RequireAdmin` is a clear message only:
 * the backend rejects every request of a non-admin.
 */
export function UserCvs({ userId }: UserCvsProps) {
  return (
    <RequireAdmin>
      <Cvs userId={userId} />
    </RequireAdmin>
  );
}
