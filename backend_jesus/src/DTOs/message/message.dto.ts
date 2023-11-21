import { IsString } from "class-validator";

export class messageDto {
    @IsString()
    id  :string

    @IsString()
    conversationId  :       string

    @IsString()
    content         :       string

    @IsString()
    senderId        :       string

    @IsString()
    recieverId      :       string
}