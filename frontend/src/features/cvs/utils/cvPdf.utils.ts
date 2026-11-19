const PDF_TYPE = "application/pdf";

/**
 * Turns the base64 text of the backend (`exportCvPdf`) into a PDF file object. Throws when the text is not valid base64.
 * A plain loop fills the byte array: it is several times faster than `Uint8Array.from(text, mapFn)`, which calls a function
 * for every character. The backend limits the PDF size (5 MB), so the loop stays short.
 */
export function base64ToPdfBlob(base64: string): Blob {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return new Blob([bytes], { type: PDF_TYPE });
}
