import { describe, expect, it } from "vitest";
import { base64ToPdfBlob } from "./cvPdf.utils";

describe("base64ToPdfBlob", () => {
  it("decodes the text into a PDF file with the same bytes", async () => {
    const blob = base64ToPdfBlob(btoa("%PDF-1.7 test"));

    expect(blob.type).toBe("application/pdf");
    expect(await blob.text()).toBe("%PDF-1.7 test");
  });

  it("keeps every byte value, also the ones above 127", async () => {
    const all = Uint8Array.from({ length: 256 }, (_, value) => value);
    const base64 = btoa(String.fromCharCode(...all));

    const blob = base64ToPdfBlob(base64);

    expect(new Uint8Array(await blob.arrayBuffer())).toEqual(all);
  });

  it("makes an empty file from empty text", () => {
    expect(base64ToPdfBlob("").size).toBe(0);
  });

  it("throws for text that is not base64", () => {
    expect(() => base64ToPdfBlob("***not base64***")).toThrow();
  });
});
