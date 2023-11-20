import { Module } from "@nestjs/common";
import { MyGeteway } from "./geteway";

@Module({
    providers: [MyGeteway],
})
export class GetawayModule{

}