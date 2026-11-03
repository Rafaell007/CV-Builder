import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { JwtModule } from "@nestjs/jwt";
import { ThrottlingModule } from "../../common/throttling";
import { MailModule } from "../mail";
import { AuthResolver } from "./auth.resolver";
import { AuthService } from "./auth.service";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { PasswordResetResolver } from "./password-reset.resolver";
import { PasswordResetService } from "./password-reset.service";
import { SessionCookiesService } from "./session-cookies.service";
import { TokenService } from "./token.service";
import { VerificationResolver } from "./verification.resolver";
import { VerificationService } from "./verification.service";

/**
 * Registers `JwtAuthGuard` for every resolver. Guards run in registration order, so `AppModule`
 * must import this module before `ApiConventionsModule`: `RolesGuard` needs `request.user` to exist.
 */
@Module({
  imports: [JwtModule.register({}), ThrottlingModule, MailModule], // secrets are passed per call, from the validated config
  providers: [
    AuthResolver,
    AuthService,
    VerificationResolver,
    VerificationService,
    PasswordResetResolver,
    PasswordResetService,
    TokenService,
    SessionCookiesService,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
export class AuthModule {}
