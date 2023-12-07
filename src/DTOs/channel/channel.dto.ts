import { IsNotEmpty, IsString, Max, MaxLength } from "class-validator";

export class channelDto {
    
    @IsString({message : "channel name must be a string ."})
    id ? : string;

    @IsString({message : "channel name must be a string ."})
    @IsNotEmpty({message : "channel name is empty ."})
    @MaxLength(20, {message : "name is too long"})
    name : string
    
    users ? : string[]; 
    
    admins ? : string[]; 
    
    mutedUsersId ? : string[];
    
    bannedUsers ? : string[];
    
    @IsString({message : "channel name must be a string ."})
    owner       ? : string;
    
    IsPrivate ? : boolean;
    
    IsProtected ? : boolean;
    
    @IsString({message : "channel name must be a string ."})
    password    ? : string;

    passwordHash  ? : string
}
