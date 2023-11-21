import { Controller, Post, Res, Req, Body, UnauthorizedException, UseGuards, Get } from "@nestjs/common";
import { TwoFAService } from "./2FA.service";
import { Response } from "express";
import { UserDto } from "src/DTOs/User/user.dto";
import { UserService } from "./user.service";
import { JwtAuth } from "./jwt.guard";

@Controller('2FA')
export class TwoFAConroller {
    constructor(private readonly TwoFAService: TwoFAService, private readonly userService: UserService) {}

    @Post('generate')
    @UseGuards(JwtAuth)
    async register(@Res() response:Response, @Req() req: Request & {user: UserDto}) {

        try {
            const user = req.user;
            console.log(`user: ${user.username}`);
            
            const code = await this.TwoFAService.generate2FASecret(user);
            response.status(200).json({code});
        }
        catch (error) {
            response.status(400).json(error);
        }
    }

    @Post('validation')
    @UseGuards(JwtAuth)
    async validate2FA(@Req() req:Request & {user: UserDto}, @Body('code') code : string, @Res() res: Response) {

        const login = req.user.username;
        const Pin = code;
        console.log(`hello : ${code}, hello : ${login}`)
        try {

            const user = await this.userService.getUser(login);

            const isValid = await this.TwoFAService.TwoFACodeValidation(Pin, user.TwoFASecret);

            if (!isValid)
                throw new UnauthorizedException('Wrong Authentication code');
            res.status(201).json(user)
        }
        catch (error){

            res.status(400).json(error);
        }
    }
}