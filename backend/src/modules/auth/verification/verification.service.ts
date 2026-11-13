import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Clock } from "../../../common/clock";
import type { Environment } from "../../../config";
import { PrismaService } from "../../../prisma/prisma.service";
import { MailService } from "../../mail";
import type { SessionUser } from "../models/session-user";
import { SESSION_USER_SELECT } from "../models/session-user.select";
import {
  generateVerificationCode,
  hashesMatch,
  hashVerificationCode,
  VERIFICATION_CODE_TTL_MS,
  VERIFICATION_MAX_ATTEMPTS,
  VERIFICATION_RESEND_COOLDOWN_MS,
} from "./verification-code";

/** `extensions.reason` values of the verification errors. The frontend shows a message for each one. */
export const VerificationReason = {
  AlreadyVerified: "ALREADY_VERIFIED",
  CodeInvalid: "CODE_INVALID",
  CodeExpired: "CODE_EXPIRED",
  CodeUsed: "CODE_USED",
  TooManyAttempts: "TOO_MANY_ATTEMPTS",
  ResendCooldown: "RESEND_COOLDOWN",
} as const;

const ALREADY_VERIFIED = "Email is already verified";

/** Creates, sends and checks the 6-digit codes of the verification page (D20). */
@Injectable()
export class VerificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
    private readonly clock: Clock,
    private readonly config: ConfigService<Environment, true>,
  ) {}

  /**
   * Creates a new code and mails it. The earlier codes of the user stop working at once.
   * Used by `resendCode`, and by sign-up for the first code. It does not check the cooldown.
   */
  async issueCode(user: { id: string; email: string }): Promise<void> {
    const code = generateVerificationCode();
    const now = this.clock.now();

    await this.prisma.$transaction([
      this.prisma.verificationCode.deleteMany({ where: { userId: user.id } }),
      this.prisma.verificationCode.create({
        data: {
          userId: user.id,
          codeHash: this.hash(code),
          // Set from the clock, not by the database, so the cooldown and the expiry use one time source.
          createdAt: now,
          expiresAt: new Date(now.getTime() + VERIFICATION_CODE_TTL_MS),
        },
      }),
    ]);
    // The mail is sent last, so a code that was never created is never mailed. The code is not logged.
    await this.mail.sendVerificationCode(user.email, code);
  }

  /** Mails a new code. Allowed once per `VERIFICATION_RESEND_COOLDOWN_MS`. */
  async resendCode(userId: string): Promise<void> {
    const user = await this.findUser(userId);
    if (user.isVerified) throw alreadyVerified();

    const last = await this.prisma.verificationCode.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    });
    if (
      last !== null &&
      this.clock.now().getTime() - last.createdAt.getTime() < VERIFICATION_RESEND_COOLDOWN_MS
    ) {
      throw new HttpException(
        {
          message: "Please wait before requesting another code",
          reason: VerificationReason.ResendCooldown,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    await this.issueCode(user);
  }

  /**
   * Checks the code of the newest mail and marks the user as verified.
   * A code works once, for `VERIFICATION_CODE_TTL_MS`, and for `VERIFICATION_MAX_ATTEMPTS` tries.
   */
  async verifyEmail(userId: string, code: string): Promise<SessionUser> {
    const user = await this.findUser(userId);
    if (user.isVerified) throw alreadyVerified();

    const now = this.clock.now();
    const stored = await this.prisma.verificationCode.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: { id: true, codeHash: true, expiresAt: true, usedAt: true },
    });
    if (stored === null)
      throw codeError("Invalid verification code", VerificationReason.CodeInvalid);
    if (stored.usedAt !== null) {
      throw codeError("Verification code has already been used", VerificationReason.CodeUsed);
    }
    if (stored.expiresAt <= now) {
      throw codeError("Verification code has expired", VerificationReason.CodeExpired);
    }

    // The try is counted before the code is compared, in one statement. Parallel requests cannot
    // make more tries than the limit, because only the first ones find `attempts` below it.
    const { count } = await this.prisma.verificationCode.updateMany({
      where: { id: stored.id, usedAt: null, attempts: { lt: VERIFICATION_MAX_ATTEMPTS } },
      data: { attempts: { increment: 1 } },
    });
    if (count === 0) {
      // The try is also refused when a parallel request has just used the code. Read the row again to name the right cause.
      const current = await this.prisma.verificationCode.findFirst({
        where: { id: stored.id },
        select: { usedAt: true },
      });
      if (current?.usedAt != null) {
        throw codeError("Verification code has already been used", VerificationReason.CodeUsed);
      }
      throw new HttpException(
        {
          message: "Too many wrong attempts, request a new code",
          reason: VerificationReason.TooManyAttempts,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    if (!hashesMatch(stored.codeHash, this.hash(code))) {
      throw codeError("Invalid verification code", VerificationReason.CodeInvalid);
    }

    return this.prisma.$transaction(async (tx) => {
      // Only one of two parallel correct requests can change the row; the other one finds it used.
      const { count: claimed } = await tx.verificationCode.updateMany({
        where: { id: stored.id, usedAt: null },
        data: { usedAt: now },
      });
      if (claimed === 0) {
        throw codeError("Verification code has already been used", VerificationReason.CodeUsed);
      }
      return tx.user.update({
        where: { id: userId },
        data: { isVerified: true },
        select: SESSION_USER_SELECT,
      });
    });
  }

  private async findUser(
    userId: string,
  ): Promise<{ id: string; email: string; isVerified: boolean }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, isVerified: true },
    });
    if (user === null) throw new NotFoundException("Not found");
    return user;
  }

  private hash(code: string): string {
    return hashVerificationCode(code, this.config.get("JWT_REFRESH_SECRET", { infer: true }));
  }
}

function alreadyVerified(): ConflictException {
  return new ConflictException({
    message: ALREADY_VERIFIED,
    reason: VerificationReason.AlreadyVerified,
  });
}

function codeError(message: string, reason: string): BadRequestException {
  return new BadRequestException({ message, reason });
}
