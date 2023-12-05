import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { UserDto } from "src/DTOs/User/user.dto";
import { UserService } from "./user.service";
import { authenticator } from "otplib";
import { toDataURL } from "qrcode"

@Injectable()
export class TwoFAService {
    constructor (private readonly userService: UserService, private readonly configService: ConfigService) {}

    async generate2FASecret(data: UserDto):Promise<string> {

        
        var user = await this.userService.getUser(data.username)
        if (!user)
            throw new UnauthorizedException('Invald data !!')
        if (!user.TwoFASecret) {

            var secret = authenticator.generateSecret();

            await this.userService.set2FaScret(secret, data.username);
            console.log(`secret : ${secret}`);
        }
        else
            secret = user.TwoFASecret;
        const otpuri = authenticator.keyuri(user.username, process.env.TWO_FACTOR_AUTH_APP_NAME, secret);
        
        const qrImg:string = await toDataURL(otpuri);
        console.log(qrImg);
        return qrImg;
    }

    async TwoFACodeValidation(qrcode: string, secret: string):Promise<boolean> {
    
        const ret = authenticator.verify({
            token: qrcode,
            secret: secret
        });
        return ret;
    }
}