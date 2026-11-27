import { Module } from "@nestjs/common";
import { mailTransportProvider } from "./mail-transport";
import { MailService } from "./mail.service";

/** Import this module where a service must send mail (sign-up, verification, forgot password). */
@Module({
  providers: [mailTransportProvider, MailService],
  exports: [MailService],
})
export class MailModule {}
