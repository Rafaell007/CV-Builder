import { escapeHtml } from "./escape-html";

describe("escapeHtml", () => {
  it("replaces the characters that can start markup", () => {
    expect(escapeHtml(`<a href="x">Tom & 'Jerry'</a>`)).toBe(
      "&lt;a href=&quot;x&quot;&gt;Tom &amp; &#39;Jerry&#39;&lt;/a&gt;",
    );
  });

  it("leaves plain text as it is", () => {
    expect(escapeHtml("123456")).toBe("123456");
  });
});
