import type { NestExpressApplication } from "@nestjs/platform-express";
import { configureApp } from "./configure-app";

function fakeApp(trustProxyHops: number) {
  const set = jest.fn();
  const app = {
    get: () => ({ get: () => trustProxyHops }),
    set,
  } as unknown as NestExpressApplication;
  return { app, set };
}

describe("configureApp", () => {
  it("trusts no proxy by default, so X-Forwarded-For is ignored", () => {
    const { app, set } = fakeApp(0);

    configureApp(app);

    expect(set).not.toHaveBeenCalled();
  });

  it("trusts the configured number of proxies", () => {
    const { app, set } = fakeApp(2);

    configureApp(app);

    expect(set).toHaveBeenCalledWith("trust proxy", 2);
  });
});
