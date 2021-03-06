import { HttpException, HttpStatus, Injectable, NotFoundException, Res, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { SubscribersService } from '../api/subscribers/subscribers.service';

@Injectable()
export class AuthService {
    constructor(private subscriberService: SubscribersService, private jwtService: JwtService) {}

    async validateUser(email: string, pass: string): Promise<any> {
        const user = await this.subscriberService.login(email);
        if (user && user.password === pass) {
            const { password, ...result } = user;
            return result;
        }
        return null;
    }

    async login(user: any, res: any) {
        const bearerToken = await this.jwtService.sign({
            data: user,
        });

        const refreshToken = await this.signRefreshToken({
            bearerToken: bearerToken,
            user: user,
        });

        await this.storeRefreshToken(res, refreshToken);

        return res.json({
            bearerToken: bearerToken,
            user: user,
        });
    }

    async refreshToken(req: any, res: any) {
        const fullBearer = req.headers.authorization.split(' ');
        const bearer = fullBearer[0];
        const bearerToken = fullBearer[1];

        if (fullBearer.length) {
            if (bearer === 'Bearer') {
                try {
                    this.jwtService.verify(bearerToken);

                    return res.json(req.headers.authorization); // send same bearerToken like after login
                } catch (e) {
                    const refreshToken = req.signedCookies.refreshToken;

                    if (refreshToken) {
                        try {
                            const decodedRefreshToken = this.jwtService.verify(refreshToken);

                            if (decodedRefreshToken.data.bearerToken === bearerToken) {
                                const bearerToken = await this.jwtService.sign({
                                    data: decodedRefreshToken.data.user,
                                });

                                const refreshToken = await this.signRefreshToken({
                                    bearerToken: bearerToken,
                                    user: decodedRefreshToken.data.user,
                                });

                                await this.storeRefreshToken(res, refreshToken);

                                return res.json({
                                    bearerToken: bearerToken,
                                    user: decodedRefreshToken.data.user,
                                });
                            }

                            throw new HttpException('Invalid bearer token', HttpStatus.UNAUTHORIZED);
                        } catch (e) {
                            throw new HttpException(e.message, HttpStatus.UNAUTHORIZED);
                        }
                    }

                    throw new HttpException('Refresh token not found', HttpStatus.UNAUTHORIZED);
                }
            }
        }

        throw new HttpException('Bearer token not found', HttpStatus.UNAUTHORIZED);
    }

    async signRefreshToken(data: any) {
        return this.jwtService.sign(
            {
                data,
            },
            { expiresIn: 60 * 60 },
        );
    }

    // store in cookie
    async storeRefreshToken(res: any, token: any) {
        res.cookie('refreshToken', token, {
            maxAge: 60 * 60 * 1000,
            httpOnly: true,
            signed: true,
        });
    }
}
