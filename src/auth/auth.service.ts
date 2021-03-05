import {
    HttpException,
    HttpStatus,
    Injectable,
    NotFoundException,
    Res,
    UnauthorizedException,
} from '@nestjs/common';
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

    async login(user: any, res: any) {
        const payload = { email: user.email, sub: user.userId };

        // get bearer token
        const bearerToken = await this.jwtService.sign({
            data: user,
        });

        // get refresh token
        const refreshToken = this.jwtService.sign(
            {
                data: {
                    bearerToken: bearerToken,
                    user: user,
                },
            },
            { expiresIn: 60 * 60 },
        );

        res.cookie('refreshToken', 'refresh token goes here...');

        // store refresh token in cookie
        // res.cookie('refreshToken', refreshToken, {
        //     maxAge: 60 * 60,
        //     httpOnly: true,
        //     signed: true,
        // });

        return res.json({
            access_token: bearerToken,
            user: user,
        });
    }

    async refreshToken(req: any) {
        // return req.signedCookies;

        const fullBearer = req.headers.authorization.split(' ');
        const bearer = fullBearer[0];
        const bearerToken = fullBearer[1];

        if (fullBearer.length) {
            // check bearer token validity
            if (bearer === 'Bearer') {
                try {
                    this.jwtService.verify(bearerToken);
                    return req.headers.authorization; // send same bearerToken like after login
                } catch (e) {}
            } else {
                throw new UnauthorizedException();
            }

            // check refresh token validity
            const refreshToken = await this.getToken(req, 'refreshToken');

            if (refreshToken) {
                try {
                    const decodedRefreshToken = this.jwtService.verify(
                        refreshToken,
                    );

                    if (decodedRefreshToken.bearerToken === bearerToken) {
                        // get bearer token
                        const bearerToken = await this.jwtService.sign({
                            data: decodedRefreshToken.data.user,
                        });

                        // get refresh token
                        const refreshToken = this.jwtService.sign(
                            {
                                data: {
                                    bearerToken: bearerToken,
                                    user: decodedRefreshToken.data.user,
                                },
                            },
                            { expiresIn: 60 * 60 },
                        );

                        // res.cookie('refreshToken', 'refresh token goes here...');

                        // store refresh token in cookie
                        // res.cookie('refreshToken', refreshToken, {
                        //     maxAge: 60 * 60,
                        //     httpOnly: true,
                        //     signed: true,
                        // });

                        // return res.json({
                        //     access_token: bearerToken,
                        //     user: decodedRefreshToken.data.user,
                        // });
                    } else {
                        throw new HttpException(
                            'Refresh token expired',
                            HttpStatus.UNAUTHORIZED,
                        );
                    }
                } catch (e) {
                    throw new HttpException(
                        'Refresh token expired',
                        HttpStatus.UNAUTHORIZED,
                    );
                }
            } else {
                throw new HttpException(
                    'Refresh token not found',
                    HttpStatus.NOT_FOUND,
                );

                // return res.status(422).json(
                //     { errors: [], message: 'Refresh token not found' }
                // );
            }
        } else {
            throw new UnauthorizedException();
        }
    }

    async getToken(request, tokenName) {
        const cookies = request.headers.cookie.split(';');

        const cookieObj = {};

        cookies.forEach((cookie) => {
            const cookieArr = cookie.split('=');
            cookieObj[cookieArr[0]] = cookieArr[1];
        });

        return cookieObj[tokenName];
    }
}
