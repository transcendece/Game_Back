import { IsString } from "class-validator";


export class UserDto {

    @IsString()
    id : string
    
    @IsString()
    username : string;

    @IsString()
    email :    string;

    avatar : string;

    achievements : string[];

    TwoFASecret: string;

    IsEnabled: boolean;
}

// https://photos.app.goo.gl/2v1UP58NK5cs3qhP9
// name: string;
// userName: string;
// rank: number;
// level: number;
// pathImg: string;
// avatar: string;