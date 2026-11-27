import { Module } from "@nestjs/common";
import { AvatarsController } from "./avatars/avatars.controller";
import { AvatarsService } from "./avatars/avatars.service";
import { UsersResolver } from "./users.resolver";
import { UsersService } from "./users.service";

@Module({
  controllers: [AvatarsController],
  providers: [UsersResolver, UsersService, AvatarsService],
})
export class UsersModule {}
