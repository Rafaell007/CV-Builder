import type { Provider } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createTransport, type Transporter } from "nodemailer";
import type { Environment } from "../../config";

/** Injection token for the Nodemailer transport. Tests replace it with a mock. */
export const MAIL_TRANSPORT = Symbol("MAIL_TRANSPORT");

/** Builds the SMTP transport from the validated config. Mailpit needs no login, so `auth` is optional. */
export const mailTransportProvider: Provider<Transporter> = {
  provide: MAIL_TRANSPORT,
  inject: [ConfigService],
  useFactory: (config: ConfigService<Environment, true>) => {
    const user = config.get("SMTP_USER", { infer: true });
    const pass = config.get("SMTP_PASS", { infer: true });

    const port = config.get("SMTP_PORT", { infer: true });

    return createTransport({
      host: config.get("SMTP_HOST", { infer: true }),
      port,
      secure: port === 465, // port 465 is TLS from the start; other ports upgrade with STARTTLS when the server offers it
      ...(user && pass ? { auth: { user, pass } } : {}),
    });
  },
};
