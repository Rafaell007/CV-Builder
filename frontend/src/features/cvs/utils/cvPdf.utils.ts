const PDF_TYPE = "application/pdf";
// The browser may start the download a moment after `click()`, so the address stays valid for a short time.
const REVOKE_DELAY_MS = 1000;

/** Turns the base64 text of the backend (`exportCvPdf`) into a PDF file object. Throws when the text is not valid base64. */
export function base64ToPdfBlob(base64: string): Blob {
  const binary = atob(base64);
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new Blob([bytes], { type: PDF_TYPE });
}

/** Starts the download of a file in the browser, with this file name. No new tab opens and the page stays as it is. */
export function saveFile(file: Blob, fileName: string): void {
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), REVOKE_DELAY_MS);
}
