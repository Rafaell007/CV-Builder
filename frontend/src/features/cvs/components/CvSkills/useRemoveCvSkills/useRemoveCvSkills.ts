"use client";

import type { Reference } from "@apollo/client";
import { useApolloClient, useMutation } from "@apollo/client/react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { useToast } from "@/shared/components";
import { CvSkillsDocument, RemoveCvSkillsDocument } from "@/shared/graphql";
import { toCvSkillFailure } from "../utils";

/**
 * The Remove skills flow: the selection mode, the chosen skills and the confirmation (AC-26 to AC-35).
 * REMOVE SKILLS starts the selection mode. A skill is chosen by the id of its CV-skill link, the id the backend
 * uses. CANCEL and Escape leave the mode and clear the choice. The confirmation sends `removeCvSkills`. Skills leave
 * the list only after the backend answered: the answer evicts them from the cache and the list loads again.
 * On success the mode ends. On failure the confirmation closes and a toast shows the reason (a toast stays behind an
 * open modal where a keyboard user cannot reach it); the choice stays, so the user can try again.
 */
export function useRemoveCvSkills(cvId: string) {
  const t = useTranslations("cvs.skills.remove");
  const toast = useToast();
  const client = useApolloClient();
  const [selecting, setSelecting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [confirming, setConfirming] = useState(false);
  const [removeCvSkills, { loading }] = useMutation(RemoveCvSkillsDocument);

  // A ref changes at once, `loading` only after the next render: two calls in the same tick cannot both pass.
  const sending = useRef(false);

  function start() {
    setSelectedIds([]);
    setSelecting(true);
  }

  function cancel() {
    setSelecting(false);
    setSelectedIds([]);
    setConfirming(false);
  }

  function toggle(id: string) {
    setSelectedIds((ids) =>
      ids.includes(id) ? ids.filter((other) => other !== id) : [...ids, id],
    );
  }

  function askToRemove() {
    if (selectedIds.length > 0) setConfirming(true);
  }

  async function confirm(): Promise<boolean> {
    if (selectedIds.length === 0 || sending.current) return false;
    sending.current = true;
    try {
      await removeCvSkills({
        variables: { input: { cvId, ids: selectedIds } },
        update: (cache) => {
          // Leave the removed skills out of the cached list instead of evicting them: an evicted skill makes the
          // cached list incomplete, and the page would fall back to the loading state until the list loads again.
          cache.modify({
            fields: {
              cvSkills: (existing: readonly Reference[] = [], { readField }) =>
                existing.filter((ref) => !selectedIds.includes(readField<string>("id", ref) ?? "")),
            },
          });
          cache.gc();
        },
        // The list loads again, so it shows what the backend holds now.
        refetchQueries: [CvSkillsDocument],
      });
      cancel();
      return true;
    } catch (failure) {
      setConfirming(false);
      const reason = toCvSkillFailure(failure);
      // A link is already gone (or the CV is not visible any more): load the list again so the stale skills leave it.
      if (reason === "notFound") {
        void client.refetchQueries({ include: [CvSkillsDocument] });
        cancel();
      }
      toast.error({
        title: t("failedTitle"),
        description: t(reason === "notFound" || reason === "forbidden" ? reason : "failedText"),
      });
      return false;
    } finally {
      sending.current = false;
    }
  }

  // Escape leaves the selection mode. While the confirmation is open, Escape belongs to the modal.
  useEffect(() => {
    if (!selecting || confirming) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setSelecting(false);
      setSelectedIds([]);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [selecting, confirming]);

  return {
    selecting,
    selectedIds,
    count: selectedIds.length,
    confirming,
    pending: loading,
    start,
    cancel,
    toggle,
    askToRemove,
    cancelConfirm: () => setConfirming(false),
    confirm,
  };
}

export type UseRemoveCvSkillsResult = ReturnType<typeof useRemoveCvSkills>;
