import { CanActivate, Injectable, ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Request } from "express";
import { UserService } from "./user.service";


@Injectable()
export class JwtAuth implements CanActivate {
    constructor(private jwtService: JwtService, private userService: UserService) {}
    async canActivate(context: ExecutionContext): Promise<boolean> {
        try {
            var request = context.switchToHttp().getRequest();
            var token : string = this.extractTokenFromHeader(request);
            // var token : string = request.header.Authorization;
            
            // console.log(request.header.);
            
            console.log(`token ====== ${token}`);
            
            if (!token) return false;
                var payload = this.jwtService.verify(token)
            
        } catch (error) {
            throw new UnauthorizedException('sir awld qahba, 7na kanla3bo hna')   
        }
        
        const user = await this.userService.getUser(payload.sub)
        console.log(`user dyal jwt : ${payload.sub}, token ${token}`);

        if (!user) {
            return false;
        }
        request.user = user;
        return true;
    }

    extractTokenFromHeader(req: Request) {

        console.log(`cookied :: ${req.cookies}`);
        
        return req.cookies['jwt-token'];
    }
}