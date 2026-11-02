import { Role } from "../../generated/prisma/enums";
import type { AuthContext } from "./auth-context";
import { AuthResolver } from "./auth.resolver";
import type { AuthService } from "./auth.service";
import type { SessionUser } from "./models/session-user";
import type { SessionCookiesService } from "./session-cookies.service";

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
    signOut: jest.fn().mockResolvedValue(undefined),
    findSessionUser: jest.fn().mockResolvedValue(USER),
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
