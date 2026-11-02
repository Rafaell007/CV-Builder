import { ConfigService } from "@nestjs/config";
import type { NestExpressApplication } from "@nestjs/platform-express";
import type { Environment } from "./config";

/** HTTP settings of the Express app. `main.ts` and the integration tests both call it, so tests run the same setup. */
export function configureApp(app: NestExpressApplication): void {
  const config = app.get<ConfigService<Environment, true>>(ConfigService);
  const proxyHops = config.get("TRUST_PROXY_HOPS", { infer: true });
  // Express then takes `req.ip` from `X-Forwarded-For`, skipping this many proxies: https://expressjs.com/en/guide/behind-proxies.html
  if (proxyHops > 0) app.set("trust proxy", proxyHops);
}
