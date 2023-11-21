import { Controller, Get, UseGuards, Res, Req } from "@nestjs/common";
import { FortyTwoOauthGuard } from "./42-oauth.guard";
import { Request, Response } from "express";
import { JwtAuth } from "./jwt.guard";
import { GoogleGuard } from "./google.OAuth.guard";
import { UserDto } from "src/DTOs/User/user.dto";
import { UserService } from "./user.service";

@Controller('auth')
export class AuthController {
    constructor(private userService: UserService) {}

    // console.log(`here: ${process.env.CLIENT_ID_42}`);
    
    @Get('42')
    @UseGuards(FortyTwoOauthGuard)
    async fortytwoAuth(@Req() req:Request) {}

    @Get('google')
    @UseGuards(GoogleGuard)
    async GoogleAuth(@Req() req: Request) {}

    @Get('42/callback')
    @UseGuards(FortyTwoOauthGuard)
    async fortytwoAuthCallback(@Req() req:Request & {user: UserDto},  @Res() res: Response) {
        console.log(`login : ${req.user.username}`);
        
        const user = await this.userService.createUser(req.user);

        const token = await this.userService.sign(user.id, user.username);
        res.cookie('jwt-token', token, {
            expires: new Date(Date.now() + 900000000),
            httpOnly: true
        })
        res.header('Authorization', token)
        console.log(`token : ${token}`);

        res.redirect(`http://localhost:3000/setting`);
    }

    @Get('google/callback')
    @UseGuards(GoogleGuard)
    async GoogleCallBack(@Req() req:Request & {user: UserDto}, @Res() res:Response) {

        const user = await this.userService.createUser(req.user);

        console.log(user);
        
        const token = await this.userService.sign(user.id, user.username);
        res.cookie('jwt-token', token, {
            expires: new Date(Date.now() * 1000),
            httpOnly: true
        })
        res.redirect(`http://localhost:5000/auth/home`);
    }

    @Get('home')
    @UseGuards(JwtAuth)
    async home(@Req() req: Request & {user: UserDto}) {
        console.log(req.user);
        return ;
    }
}
