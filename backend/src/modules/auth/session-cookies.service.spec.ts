import { ConfigService } from "@nestjs/config";
import type { Environment } from "../../config";
import type { CookieResponse } from "./auth-context";
import { SessionCookiesService } from "./session-cookies.service";

function createService(nodeEnv: string): SessionCookiesService {
  return new SessionCookiesService(new ConfigService<Environment, true>({ NODE_ENV: nodeEnv }));
}

function createResponse(): jest.Mocked<CookieResponse> {
  return { cookie: jest.fn(), clearCookie: jest.fn() };
}

describe("SessionCookiesService", () => {
  it("sets both tokens as httpOnly cookies with their lifetimes", () => {
    const response = createResponse();

    createService("development").set(response, { accessToken: "access", refreshToken: "refresh" });

    const base = { httpOnly: true, secure: false, sameSite: "lax", path: "/" };
    expect(response.cookie).toHaveBeenCalledWith("access_token", "access", {
      ...base,
      maxAge: 15 * 60 * 1000,
    });
    expect(response.cookie).toHaveBeenCalledWith("refresh_token", "refresh", {
      ...base,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  });

  it("marks the cookies secure in production only", () => {
    const production = createResponse();
    const development = createResponse();

    createService("production").set(production, { accessToken: "a", refreshToken: "r" });
    createService("development").set(development, { accessToken: "a", refreshToken: "r" });

    expect(production.cookie).toHaveBeenCalledWith(
      "access_token",
      "a",
      expect.objectContaining({ secure: true }),
    );
    expect(development.cookie).toHaveBeenCalledWith(
      "access_token",
      "a",
      expect.objectContaining({ secure: false }),
    );
  });

  it("clears both cookies with the same options they were set with", () => {
    const response = createResponse();

    createService("production").clear(response);

    const options = { httpOnly: true, secure: true, sameSite: "lax", path: "/" };
    expect(response.clearCookie).toHaveBeenCalledWith("access_token", options);
    expect(response.clearCookie).toHaveBeenCalledWith("refresh_token", options);
  });

  it("reads the tokens from the request cookies", () => {
    const service = createService("development");
    const request = { headers: { cookie: "access_token=a1; refresh_token=r1" } };

    expect(service.readAccessToken(request)).toBe("a1");
    expect(service.readRefreshToken(request)).toBe("r1");
  });

  it("returns undefined when the request has no cookies", () => {
    expect(createService("development").readAccessToken({ headers: {} })).toBeUndefined();
  });
});
