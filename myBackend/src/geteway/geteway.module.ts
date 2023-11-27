import { Module } from "@nestjs/common";
import { GameGeteway } from "./geteway";
import { ScheduleModule } from "@nestjs/schedule";

@Module({
    imports: [ScheduleModule.forRoot()],
    providers: [GameGeteway],
})
export class GetawayModule{

}