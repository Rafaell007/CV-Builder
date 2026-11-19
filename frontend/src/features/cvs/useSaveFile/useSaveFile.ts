"use client";

import { useCallback } from "react";

// The browser may start the download a moment after `click()`, so the address stays valid for a short time.
const REVOKE_DELAY_MS = 1000;

/** Starts the download of a file in the browser, with this file name. */
export type SaveFile = (file: Blob, fileName: string) => void;

/**
 * Gives the function that saves a file with the browser download (a link with `download` that is clicked). It is a
 * hook and not a util, because it works on the page (adds and removes a link) and sets a timer. No new tab opens
 * and the page stays as it is. The address of the file is freed one second after the click.
 */
export function useSaveFile(): SaveFile {
  return useCallback((file, fileName) => {
    const url = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), REVOKE_DELAY_MS);
  }, []);
}
