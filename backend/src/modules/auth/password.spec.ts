import { hashPassword, verifyPassword } from "./password";

describe("password", () => {
  it("accepts the password that was hashed", async () => {
    const passwordHash = await hashPassword("Password123!");

    await expect(verifyPassword(passwordHash, "Password123!")).resolves.toBe(true);
  });

  it("rejects a different password", async () => {
    const passwordHash = await hashPassword("Password123!");

    await expect(verifyPassword(passwordHash, "password123!")).resolves.toBe(false);
  });

  it("never stores the password itself and salts every hash", async () => {
    const first = await hashPassword("Password123!");
    const second = await hashPassword("Password123!");

    expect(first).not.toContain("Password123!");
    expect(first).not.toBe(second);
  });

  it("treats a malformed hash as a mismatch", async () => {
    await expect(verifyPassword("not-a-hash", "Password123!")).resolves.toBe(false);
  });
});
