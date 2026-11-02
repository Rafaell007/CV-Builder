import { Inject, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { Transporter } from "nodemailer";
import type { Environment } from "../../config";
import type { MailContent } from "./mail-message";
import { MAIL_TRANSPORT } from "./mail-transport";
import { buildPasswordResetLink, passwordResetTemplate } from "./templates/password-reset.template";
import { verificationCodeTemplate } from "./templates/verification-code.template";

/** Sends the application's emails. Knows the templates and the sender; knows nothing about users or tokens. */
@Injectable()
export class MailService {
  constructor(
    @Inject(MAIL_TRANSPORT) private readonly transport: Transporter,
    private readonly config: ConfigService<Environment, true>,
  ) {}

  /** Sends the 6-digit code for the verification page. */
  sendVerificationCode(to: string, code: string): Promise<void> {
    return this.send(to, verificationCodeTemplate(code));
  }

  /** Sends the link to the Reset Password page. The link is built from `FRONTEND_URL`. */
  sendPasswordReset(to: string, token: string): Promise<void> {
    const link = buildPasswordResetLink(this.config.get("FRONTEND_URL", { infer: true }), token);
    return this.send(to, passwordResetTemplate(link));
  }

  // The content is never logged: it holds codes and reset links.
  private async send(to: string, content: MailContent): Promise<void> {
    await this.transport.sendMail({
      from: this.config.get("MAIL_FROM", { infer: true }),
      to,
      subject: content.subject,
      text: content.text,
      html: content.html,
    });
  }
}
