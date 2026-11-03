import { PasswordResetResolver } from "./password-reset.resolver";
import type { PasswordResetService } from "./password-reset.service";

const service = { requestReset: jest.fn(), resetPassword: jest.fn() };

function createResolver(): PasswordResetResolver {
  return new PasswordResetResolver(service as unknown as PasswordResetService);
}

describe("PasswordResetResolver", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("forgotPassword passes the email on and answers true", async () => {
    service.requestReset.mockResolvedValue(undefined);

    await expect(createResolver().forgotPassword({ email: "ada@example.com" })).resolves.toBe(true);

    expect(service.requestReset).toHaveBeenCalledWith("ada@example.com");
  });

  it("resetPassword passes the token and the password on and answers true", async () => {
    service.resetPassword.mockResolvedValue(undefined);

    await expect(
      createResolver().resetPassword({ token: "abc", newPassword: "new-password-1" }),
    ).resolves.toBe(true);

    expect(service.resetPassword).toHaveBeenCalledWith("abc", "new-password-1");
  });

  it("resetPassword passes the error of the service on", async () => {
    service.resetPassword.mockRejectedValue(new Error("expired"));

    await expect(
      createResolver().resetPassword({ token: "abc", newPassword: "new-password-1" }),
    ).rejects.toThrow("expired");
  });
});
