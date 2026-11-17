import { Module } from "@nestjs/common";
import { PositionsResolver } from "./positions.resolver";
import { PositionsService } from "./positions.service";

@Module({
  providers: [PositionsResolver, PositionsService],
})
export class PositionsModule {}
