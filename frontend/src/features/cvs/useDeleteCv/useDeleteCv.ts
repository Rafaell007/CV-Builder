"use client";

import { useApolloClient, useMutation } from "@apollo/client/react";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { useToast } from "@/shared/components";
import { CvsDocument, DeleteCvDocument } from "@/shared/graphql";
import type { CvListItem } from "../cvs.types";
import { toDeleteCvFailure } from "../utils";

export type UseDeleteCvOptions = {
  /** The page the list shows now (starts at 1). */
  page: number;
  /** How many CVs the list shows on this page now. */
  rowsOnPage: number;
  /** Called with the new page when a delete leaves the current page empty. */
  onPageChange: (page: number) => void;
  /** The employee of the User CVs tab. It is sent with the request, so the backend rejects a CV of another employee. */
  userId?: string;
};

export type UseDeleteCvResult = {
  /** The CV the user chose to delete. The modal is open while this is set. */
  cv: CvListItem | null;
  /** True while the request runs. */
  pending: boolean;
  /** Opens the confirmation for this CV. */
  askToDelete: (cv: CvListItem) => void;
  /** Closes the confirmation without a request. */
  cancel: () => void;
  /** Sends `deleteCv` for the chosen CV. Resolves `true` when the CV was deleted. A second call while one runs does nothing and resolves `false`. */
  confirm: () => Promise<boolean>;
};

/**
 * State of the delete flow: which CV waits for confirmation, and the `deleteCv` request (AC-30 to AC-36, AC-39).
 * On success the CV leaves the cache (its row disappears at once), the list is loaded again for the new total,
 * and the modal closes. On failure the modal closes too and an error toast shows the reason: a toast stays behind an
 * open modal where a keyboard user cannot reach it (see the Toast README).
 * `NOT_FOUND` and `FORBIDDEN` have their own texts. After `NOT_FOUND` the CV is gone, so the list loads again.
 * When the deleted CV was the only one on page 2 or later, the same page would be empty: `onPageChange` goes back one page.
 */
export function useDeleteCv({
  page,
  rowsOnPage,
  onPageChange,
  userId,
}: UseDeleteCvOptions): UseDeleteCvResult {
  const t = useTranslations("cvs.delete");
  const toast = useToast();
  const client = useApolloClient();
  const [cv, setCv] = useState<CvListItem | null>(null);
  const [deleteCv, { loading }] = useMutation(DeleteCvDocument);

  // A ref changes at once, `loading` only after the next render: two calls in the same tick cannot both pass.
  const sending = useRef(false);

  async function confirm(): Promise<boolean> {
    // The same mutation must not be sent twice while it runs.
    if (cv === null || sending.current) return false;
    sending.current = true;
    // Read before the request: the CV leaves the list while it runs.
    const wasLastRowOfPage = rowsOnPage === 1 && page > 1;
    try {
      await deleteCv({
        variables: { id: cv.id, ...(userId === undefined ? {} : { userId }) },
        update: (cache) => {
          const id = cache.identify(cv);
          if (id === undefined) return;
          cache.evict({ id });
          // Every cached page holds the old total. The page that opens after "go back one page" would show it.
          cache.evict({ id: "ROOT_QUERY", fieldName: "cvs" });
          cache.gc();
        },
        // The total and the pages change: the open list loads again with the same search, sort and page.
        refetchQueries: [CvsDocument],
      });
      setCv(null);
      if (wasLastRowOfPage) onPageChange(page - 1);
      return true;
    } catch (error) {
      setCv(null);
      const failure = toDeleteCvFailure(error);
      // The CV is already gone (or not visible to this user): load the list again so the stale row leaves it.
      if (failure === "notFound") void client.refetchQueries({ include: [CvsDocument] });
      toast.error({
        title: t("failedTitle"),
        description: failure === undefined ? t("failedText") : t(failure),
      });
      return false;
    } finally {
      sending.current = false;
    }
  }

  return {
    cv,
    pending: loading,
    askToDelete: setCv,
    cancel: () => setCv(null),
    confirm,
  };
}
