import { IsNumber, IsString } from "class-validator";


export class InviteDto {
        @IsString()
        id      :string;

        @IsString()
        invitationRecieverId :string;
        
        @IsString()
        invitationSenderId :string;

        @IsNumber()
        inviteStatus : number

}