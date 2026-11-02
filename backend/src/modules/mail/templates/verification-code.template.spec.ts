import { verificationCodeTemplate } from "./verification-code.template";

describe("verificationCodeTemplate", () => {
  const content = verificationCodeTemplate("123456");

  it("has a subject", () => {
    expect(content.subject).toBe("Your CV Builder verification code");
  });

  it("shows the code in the text and the HTML", () => {
    expect(content.text).toContain("123456");
    expect(content.html).toContain("<strong");
    expect(content.html).toContain("123456");
  });

  it("tells the user how long the code is valid", () => {
    expect(content.text).toContain("10 minutes");
    expect(content.html).toContain("10 minutes");
  });

  it("escapes the code in the HTML", () => {
    expect(verificationCodeTemplate("<b>1</b>").html).not.toContain("<b>1</b>");
  });
});
