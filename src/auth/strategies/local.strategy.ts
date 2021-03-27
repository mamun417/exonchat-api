import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { HttpException, HttpStatus, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
    constructor(private authService: AuthService) {
        super({
            usernameField: 'login_info',
            passwordField: 'pass',
        });
    }

    async validate(login_info: any, password: string): Promise<any> {
        const parsedLoginInfo = JSON.parse(login_info);

        const user = await this.authService.validateUserForLogin(parsedLoginInfo, password);

        if (!user) {
            throw new HttpException(`Invalid Login Credentials`, HttpStatus.NOT_FOUND);
        }
        return user;
    }

    // handleRequest(err, user, info) {
    //     // You can throw an exception based on either "info" or "err" arguments
    //     if (err || !user) {
    //         throw err || new UnauthorizedException();
    //     }
    //     return user;
    // }
}
