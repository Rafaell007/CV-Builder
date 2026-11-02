import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { JwtModule } from "@nestjs/jwt";
import { ThrottlingModule } from "../../common/throttling";
import { AuthResolver } from "./auth.resolver";
import { AuthService } from "./auth.service";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { SessionCookiesService } from "./session-cookies.service";
import { TokenService } from "./token.service";

/**
 * Registers `JwtAuthGuard` for every resolver. Guards run in registration order, so `AppModule`
 * must import this module before `ApiConventionsModule`: `RolesGuard` needs `request.user` to exist.
 */
@Module({
  imports: [JwtModule.register({}), ThrottlingModule], // secrets are passed per call, from the validated config
  providers: [
    AuthResolver,
    AuthService,
    TokenService,
    SessionCookiesService,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
export class AuthModule {}
