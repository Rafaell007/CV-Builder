import { Module } from "@nestjs/common";
import { APP_FILTER, APP_GUARD, APP_PIPE } from "@nestjs/core";
import { RolesGuard, VerifiedGuard } from "../auth";
import { GraphQLExceptionFilter } from "../errors";
import { createValidationPipe } from "../validation";

/** Registers the API conventions for every resolver: validation, error mapping and the role / verified guards. */
@Module({
  providers: [
    { provide: APP_PIPE, useFactory: createValidationPipe },
    { provide: APP_FILTER, useClass: GraphQLExceptionFilter },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: VerifiedGuard },
  ],
})
export class ApiConventionsModule {}
