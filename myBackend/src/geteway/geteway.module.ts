import { Module } from "@nestjs/common";
import { GameGeteway } from "./geteway";

@Module({
    providers: [GameGeteway],
})
export class GetawayModule{

}