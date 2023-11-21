import { IsOptional, IsString } from "class-validator";
import { messageDto } from "../message/message.dto";

export class ConversationDto {
    @IsString()
    id              : string
    
    @IsString()
    senderId         : string

    @IsString()
    recieverId         : string

    // @IsOptional()
    // Messages      : messageDto[]
}