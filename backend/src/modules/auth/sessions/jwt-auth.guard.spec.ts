import { UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ExecutionContextHost } from "@nestjs/core/helpers/execution-context-host";
import { Public } from "../../../common/auth";
import type { AuthUser } from "../../../common/auth";
import { Role } from "../../../generated/prisma/enums";
import type { AuthContext, AuthRequest } from "../auth-context";
import type { AuthService } from "../auth.service";
import { JwtAuthGuard } from "./jwt-auth.guard";
import type { SessionCookiesService } from "./session-cookies.service";
import type { TokenService } from "./token.service";

class ProtectedResolver {
  list(): void {}
}

@Public()
class OpenResolver {
  list(): void {}
}

class MixedResolver {
  @Public()
  open(): void {}
}

const USER: AuthUser = { id: "user-1", role: Role.USER, isVerified: true };

function setup(options: {
  cookie?: string | undefined;
  claims?: { userId: string; tokenVersion: number } | undefined;
  user?: AuthUser | undefined;
}) {
  const cookies = {
    readAccessToken: jest.fn().mockReturnValue(options.cookie),
  } as unknown as jest.Mocked<SessionCookiesService>;
  const tokens = {
    verifyAccessToken: jest.fn().mockResolvedValue(options.claims),
  } as unknown as jest.Mocked<TokenService>;
  const authService = {
    findAuthUser: jest.fn().mockResolvedValue(options.user),
  } as unknown as jest.Mocked<AuthService>;
  const request: AuthRequest = { headers: {} };
  const guard = new JwtAuthGuard(new Reflector(), cookies, tokens, authService);

  const run = (resolverClass: new () => object, handler: () => void) => {
    const context: AuthContext = { req: request, res: {} as AuthContext["res"] };
    const args = [{}, {}, context, {}]; // GraphQL resolver args: root, args, context, info
    return guard.canActivate(new ExecutionContextHost(args, resolverClass, handler));
  };

  return { run, request, tokens, authService };
}

describe("JwtAuthGuard", () => {
  it("puts the user on the request when the access token is valid", async () => {
    const { run, request } = setup({
      cookie: "jwt",
      claims: { userId: "user-1", tokenVersion: 0 },
      user: USER,
    });

    await expect(run(ProtectedResolver, ProtectedResolver.prototype.list)).resolves.toBe(true);

    expect(request.user).toEqual(USER);
  });

  it("answers UNAUTHENTICATED when there is no cookie", async () => {
    const { run } = setup({});

    await expect(run(ProtectedResolver, ProtectedResolver.prototype.list)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it("tells the client to sign in", async () => {
    const { run } = setup({});

    await expect(run(ProtectedResolver, ProtectedResolver.prototype.list)).rejects.toThrow(
      "Sign in to continue",
    );
  });

  it("does not check a token when there is no cookie", async () => {
    const { run, tokens } = setup({});

    await run(ProtectedResolver, ProtectedResolver.prototype.list).catch(() => undefined);

    expect(tokens.verifyAccessToken).not.toHaveBeenCalled();
  });

  it("answers UNAUTHENTICATED when the token is invalid or expired", async () => {
    const { run, authService } = setup({ cookie: "bad", claims: undefined });

    await expect(run(ProtectedResolver, ProtectedResolver.prototype.list)).rejects.toThrow(
      UnauthorizedException,
    );
    expect(authService.findAuthUser).not.toHaveBeenCalled();
  });

  it("answers UNAUTHENTICATED when the user no longer exists", async () => {
    const { run } = setup({
      cookie: "jwt",
      claims: { userId: "deleted", tokenVersion: 0 },
      user: undefined,
    });

    await expect(run(ProtectedResolver, ProtectedResolver.prototype.list)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it("looks the user up by id and token version, so a token from before a password change finds no one", async () => {
    const { run, authService } = setup({
      cookie: "jwt",
      claims: { userId: "user-1", tokenVersion: 2 },
      user: undefined,
    });

    await expect(run(ProtectedResolver, ProtectedResolver.prototype.list)).rejects.toThrow(
      UnauthorizedException,
    );
    expect(authService.findAuthUser).toHaveBeenCalledWith("user-1", 2);
  });

  it("lets a @Public() handler through without a session, and leaves request.user empty", async () => {
    const { run, request } = setup({});

    await expect(run(MixedResolver, MixedResolver.prototype.open)).resolves.toBe(true);

    expect(request.user).toBeUndefined();
  });

  it("lets a @Public() class through without a session", async () => {
    const { run } = setup({});

    await expect(run(OpenResolver, OpenResolver.prototype.list)).resolves.toBe(true);
  });

  it("still identifies the user on a @Public() handler when the token is valid", async () => {
    const { run, request } = setup({
      cookie: "jwt",
      claims: { userId: "user-1", tokenVersion: 0 },
      user: USER,
    });

    await run(MixedResolver, MixedResolver.prototype.open);

    expect(request.user).toEqual(USER);
  });
});
