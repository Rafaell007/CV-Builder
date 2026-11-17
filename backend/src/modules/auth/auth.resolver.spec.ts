import { UnauthorizedException } from "@nestjs/common";
import { Role } from "../../generated/prisma/enums";
import type { AuthContext } from "./auth-context";
import { AuthResolver } from "./auth.resolver";
import type { AuthService } from "./auth.service";
import type { SessionUser } from "./models/session-user";
import type { SessionCookiesService } from "./sessions/session-cookies.service";

const USER: SessionUser = {
  id: "user-1",
  email: "user1@example.com",
  role: Role.USER,
  isVerified: true,
  firstName: null,
  lastName: null,
};

function setup() {
  const authService = {
    signIn: jest
      .fn()
      .mockResolvedValue({ user: USER, accessToken: "access", refreshToken: "refresh" }),
    signUp: jest.fn().mockResolvedValue({
      user: { ...USER, isVerified: false },
      accessToken: "access",
      refreshToken: "refresh",
    }),
    signOut: jest.fn().mockResolvedValue(undefined),
    refresh: jest.fn().mockResolvedValue({ accessToken: "access-2", refreshToken: "refresh-2" }),
    findSessionUser: jest.fn().mockResolvedValue(USER),
    changePassword: jest
      .fn()
      .mockResolvedValue({ accessToken: "access-3", refreshToken: "refresh-3" }),
  } as unknown as jest.Mocked<AuthService>;
  const cookies = {
    set: jest.fn(),
    clear: jest.fn(),
    readRefreshToken: jest.fn().mockReturnValue("refresh"),
  } as unknown as jest.Mocked<SessionCookiesService>;
  const context = { req: { headers: {} }, res: {} } as AuthContext;
  return { resolver: new AuthResolver(authService, cookies), authService, cookies, context };
}

describe("AuthResolver", () => {
  it("signIn returns the user and sets both cookies", async () => {
    const { resolver, authService, cookies, context } = setup();
    const input = { email: "user1@example.com", password: "Password123!" };

    await expect(resolver.signIn(input, context)).resolves.toBe(USER);

    expect(authService.signIn).toHaveBeenCalledWith(input);
    expect(cookies.set).toHaveBeenCalledWith(context.res, {
      accessToken: "access",
      refreshToken: "refresh",
    });
  });

  it("signUp returns the new user and sets both cookies", async () => {
    const { resolver, authService, cookies, context } = setup();
    const input = { email: "new@example.com", password: "Password123!" };

    await expect(resolver.signUp(input, context)).resolves.toEqual({ ...USER, isVerified: false });

    expect(authService.signUp).toHaveBeenCalledWith(input);
    expect(cookies.set).toHaveBeenCalledWith(context.res, {
      accessToken: "access",
      refreshToken: "refresh",
    });
  });

  it("signUp sets no cookie when the email is taken", async () => {
    const { resolver, authService, cookies, context } = setup();
    authService.signUp.mockRejectedValue(new Error("An account with this email already exists"));

    await expect(
      resolver.signUp({ email: "a@b.co", password: "Password123!" }, context),
    ).rejects.toThrow();

    expect(cookies.set).not.toHaveBeenCalled();
  });

  it("signIn sets no cookie when the credentials are wrong", async () => {
    const { resolver, authService, cookies, context } = setup();
    authService.signIn.mockRejectedValue(new Error("Invalid email or password"));

    await expect(
      resolver.signIn({ email: "a@b.co", password: "123456" }, context),
    ).rejects.toThrow();

    expect(cookies.set).not.toHaveBeenCalled();
  });

  it("signOut revokes the session of the cookie and clears the cookies", async () => {
    const { resolver, authService, cookies, context } = setup();

    await expect(resolver.signOut(context)).resolves.toBe(true);

    expect(authService.signOut).toHaveBeenCalledWith("refresh");
    expect(cookies.clear).toHaveBeenCalledWith(context.res);
  });

  it("refresh sets the new cookies", async () => {
    const { resolver, authService, cookies, context } = setup();

    await expect(resolver.refresh(context)).resolves.toBe(true);

    expect(authService.refresh).toHaveBeenCalledWith("refresh");
    expect(cookies.set).toHaveBeenCalledWith(context.res, {
      accessToken: "access-2",
      refreshToken: "refresh-2",
    });
  });

  it("refresh clears the cookies when the session has ended", async () => {
    const { resolver, authService, cookies, context } = setup();
    authService.refresh.mockRejectedValue(new UnauthorizedException("Session ended"));

    await expect(resolver.refresh(context)).rejects.toThrow(UnauthorizedException);

    expect(cookies.clear).toHaveBeenCalledWith(context.res);
    expect(cookies.set).not.toHaveBeenCalled();
  });

  it("refresh does not clear the cookies on an unexpected error", async () => {
    const { resolver, authService, cookies, context } = setup();
    authService.refresh.mockRejectedValue(new Error("database down"));

    await expect(resolver.refresh(context)).rejects.toThrow("database down");

    expect(cookies.clear).not.toHaveBeenCalled();
  });

  describe("changePassword", () => {
    const AUTH_USER = { id: "user-1", role: Role.USER, isVerified: false };
    const INPUT = { currentPassword: "Password123!", newPassword: "NewPassword456!" };

    it("changes the password of the signed-in user and sets the new cookies", async () => {
      const { resolver, authService, cookies, context } = setup();

      await expect(resolver.changePassword(AUTH_USER, INPUT, context)).resolves.toBe(true);

      expect(authService.changePassword).toHaveBeenCalledWith("user-1", INPUT);
      expect(cookies.set).toHaveBeenCalledWith(context.res, {
        accessToken: "access-3",
        refreshToken: "refresh-3",
      });
    });

    it("sets no cookie when the current password is wrong", async () => {
      const { resolver, authService, cookies, context } = setup();
      authService.changePassword.mockRejectedValue(new Error("Current password is incorrect"));

      await expect(resolver.changePassword(AUTH_USER, INPUT, context)).rejects.toThrow();

      expect(cookies.set).not.toHaveBeenCalled();
    });

    it("rejects a call without a signed-in user", async () => {
      const { resolver, authService, context } = setup();

      await expect(resolver.changePassword(undefined, INPUT, context)).rejects.toThrow(
        UnauthorizedException,
      );

      expect(authService.changePassword).not.toHaveBeenCalled();
    });
  });

  it("me returns the current user", async () => {
    const { resolver, authService } = setup();

    await expect(resolver.me({ id: "user-1", role: Role.USER, isVerified: true })).resolves.toBe(
      USER,
    );

    expect(authService.findSessionUser).toHaveBeenCalledWith("user-1");
  });

  it("me returns null when nobody is signed in", async () => {
    const { resolver, authService } = setup();

    await expect(resolver.me(undefined)).resolves.toBeNull();

    expect(authService.findSessionUser).not.toHaveBeenCalled();
  });
});
