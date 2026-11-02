import { buildPasswordResetLink, passwordResetTemplate } from "./password-reset.template";

describe("buildPasswordResetLink", () => {
  it("points at the reset-password page of the frontend", () => {
    expect(buildPasswordResetLink("http://localhost:3000", "abc123")).toBe(
      "http://localhost:3000/reset-password?token=abc123",
    );
  });

  it("ignores a trailing slash and a path in the frontend URL", () => {
    expect(buildPasswordResetLink("https://cv.example.com/", "abc123")).toBe(
      "https://cv.example.com/reset-password?token=abc123",
    );
  });

  it("encodes the token", () => {
    expect(buildPasswordResetLink("http://localhost:3000", "a b&c")).toBe(
      "http://localhost:3000/reset-password?token=a+b%26c",
    );
  });
});

describe("passwordResetTemplate", () => {
  const link = "http://localhost:3000/reset-password?token=abc&x=1";
  const content = passwordResetTemplate(link);

  it("has a subject", () => {
    expect(content.subject).toBe("Reset your CV Builder password");
  });

  it("puts the link in the text and in an HTML anchor", () => {
    expect(content.text).toContain(link);
    expect(content.html).toContain('href="http://localhost:3000/reset-password?token=abc&amp;x=1"');
  });

  it("tells the user how long the link is valid", () => {
    expect(content.text).toContain("1 hour");
  });
});
