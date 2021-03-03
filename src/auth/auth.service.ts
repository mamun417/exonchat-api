import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { SubscribersService } from '../api/subscribers/subscribers.service';
import { split } from 'ts-node';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private subscriberService: SubscribersService,
        private jwtService: JwtService,
    ) {}

    async validateUser(email: string, pass: string): Promise<any> {
        const user = await this.subscriberService.login(email);
        if (user && user.password === pass) {
            const { password, ...result } = user;
            return result;
        }
        return null;
    }

    async login(user: any) {
        const payload = { email: user.email, sub: user.userId };
        return {
            access_token: this.jwtService.sign(payload),
        };
    }

    async refreshToken(req: any) {
        const bt = req.headers.authorization.split(' ');
        if (bt.length) {
            if (bt[0] === 'Bearer') {
                try {
                    this.jwtService.verify(bt[1]);
                    return req.headers.authorization; // send same bt like after login
                } catch (e) {}
            } else {
                // send bearr not found
            }

            const rt = 'rt'.split(' '); //get from signedcokie
            if (rt.length) {
                try {
                    const decodedToken = this.jwtService.verify(rt[1]);

                    // if (decodedToken.bt === bt[1]) {
                    //let newBt = sign again decodedToken.user data
                    // let newRt = sign(decodedToken.user + newBt)
                    // then send newBt and store newRt to cokie
                    // } else {
                    //     // bearer token not matched
                    // }
                } catch (e) {
                    // ref token veri failed
                }
            } else {
                // send ref token not found
            }
        } else {
            return 'unauthorized';
        }
        // const verify = this.jwtService.verify(req);

        // return {
        //     access_token: this.jwtService.sign(payload),
        // };
    }
}
