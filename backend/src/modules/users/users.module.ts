import { Module } from "@nestjs/common";
import { ThrottlingModule } from "../../common/throttling";
import { AvatarsController } from "./avatars/avatars.controller";
import { AvatarsService } from "./avatars/avatars.service";
import { UserSkillsResolver } from "./skills/user-skills.resolver";
import { UserSkillsService } from "./skills/user-skills.service";
import { UsersResolver } from "./users.resolver";
import { UsersService } from "./users.service";

@Module({
  imports: [ThrottlingModule],
  controllers: [AvatarsController],
  providers: [UsersResolver, UsersService, AvatarsService, UserSkillsResolver, UserSkillsService],
})
export class UsersModule {}
