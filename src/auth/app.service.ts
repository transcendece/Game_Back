import { Injectable, Req } from "@nestjs/common";

@Injectable()
export class AppService {

    fortytwoLogin(req) {
        if (!req.user) {
            return 'No user from 42';
        }
        return {
            message: 'User Information from 42',
            user: req.user,
        };
    }

    googleLogin(req) {
        if (!req.user) {
            return "No User from Google";
        }
        return {
            message: 'User Information from Google',
            user: req.user,
        };
    }
}