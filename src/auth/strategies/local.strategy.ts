import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Body, HttpException, HttpStatus, Injectable, Req } from '@nestjs/common';
import { AuthService } from '../auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
    constructor(private authService: AuthService) {
        super({
            usernameField: 'email',
            passwordField: 'password',
            bd: Req,
        });
    }

    async validate(email: string, password: string): Promise<any> {
        console.log(Req());

        const user = await this.authService.validateUserForLogin(email, password);

        if (!user) {
            throw new HttpException(`Resource Not Found!`, HttpStatus.NOT_FOUND);
        }
        return user;
    }
}
