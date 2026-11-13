import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Clock } from "../../../common/clock";
import type { Environment } from "../../../config";
import { PrismaService } from "../../../prisma/prisma.service";
import { MailService } from "../../mail";
import { hashPassword } from "../password";
import {
  generatePasswordResetToken,
  hashPasswordResetToken,
  PASSWORD_RESET_TOKEN_TTL_MS,
} from "./password-reset-token";

/** `extensions.reason` values of the reset errors. The reset password page shows a message for each one. */
export const PasswordResetReason = {
  TokenInvalid: "RESET_TOKEN_INVALID",
  TokenExpired: "RESET_TOKEN_EXPIRED",
  TokenUsed: "RESET_TOKEN_USED",
} as const;

/** Creates, sends and checks the reset links of the forgot password and reset password pages (D20, D22). */
@Injectable()
export class PasswordResetService {
  private readonly logger = new Logger(PasswordResetService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
    private readonly clock: Clock,
    private readonly config: ConfigService<Environment, true>,
  ) {}

  /**
   * Mails a reset link when the email belongs to a user. It returns the same way when it does not,
   * so the answer never shows which emails are registered. A new link stops the older ones.
   */
  async requestReset(email: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
      select: { id: true, email: true },
    });
    if (user === null) return;

    const token = generatePasswordResetToken();
    const now = this.clock.now();
    await this.prisma.$transaction([
      this.prisma.passwordResetToken.deleteMany({ where: { userId: user.id } }),
      this.prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash: this.hash(token),
          createdAt: now,
          expiresAt: new Date(now.getTime() + PASSWORD_RESET_TOKEN_TTL_MS),
        },
      }),
    ]);

    // A failed mail must not change the answer: an error for known emails only would show who is registered.
    // Only the error message is logged. The token is never logged.
    try {
      await this.mail.sendPasswordReset(user.email, token);
    } catch (error) {
      this.logger.error(
        `Could not send the password reset mail: ${error instanceof Error ? error.message : "unknown error"}`,
      );
    }
  }

  /**
   * Sets a new password with the token from the mail. The token works once, for `PASSWORD_RESET_TOKEN_TTL_MS`.
   * The new password is saved, the token is used, the other tokens are deleted and all sessions of the user end (D22),
   * all in one transaction. It does not sign the user in: the user goes to the Sign In page.
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    const now = this.clock.now();
    const stored = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash: this.hash(token) },
      select: { id: true, userId: true, expiresAt: true, usedAt: true },
    });
    if (stored === null) throw tokenError("Invalid reset link", PasswordResetReason.TokenInvalid);
    if (stored.usedAt !== null) {
      throw tokenError("Reset link has already been used", PasswordResetReason.TokenUsed);
    }
    if (stored.expiresAt <= now) {
      throw tokenError("Reset link has expired", PasswordResetReason.TokenExpired);
    }

    const passwordHash = await hashPassword(newPassword);
    await this.prisma.$transaction(async (tx) => {
      // Only one of two parallel requests can change the row; the other one finds it used.
      const { count } = await tx.passwordResetToken.updateMany({
        where: { id: stored.id, usedAt: null },
        data: { usedAt: now },
      });
      if (count === 0) {
        throw tokenError("Reset link has already been used", PasswordResetReason.TokenUsed);
      }
      await tx.user.update({ where: { id: stored.userId }, data: { passwordHash } });
      await tx.passwordResetToken.deleteMany({
        where: { userId: stored.userId, id: { not: stored.id } },
      });
      await tx.refreshToken.deleteMany({ where: { userId: stored.userId } });
    });
  }

  private hash(token: string): string {
    return hashPasswordResetToken(token, this.config.get("JWT_REFRESH_SECRET", { infer: true }));
  }
}

function tokenError(message: string, reason: string): BadRequestException {
  return new BadRequestException({ message, reason });
}
