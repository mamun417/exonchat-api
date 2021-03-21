import { HttpException, HttpStatus, Injectable, NotFoundException, Res, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ChatAgentsService } from '../api/chat-agents/chat-agents.service';

@Injectable()
export class AuthService {
    constructor(private agentService: ChatAgentsService, private jwtService: JwtService) {}

    async validateUserForLogin(login_info: string, pass: string): Promise<any> {
        const user = await this.agentService.validateForLogin(login_info, pass);

        if (!user) {
            throw new HttpException(`Invalid Login Credentials`, HttpStatus.NOT_FOUND);
        }

        if (user && user.password === pass) {
            const { password, ...result } = user;
            return result;
        }

        return null;
    }

    async login(user: any, req: any, res: any) {
        if (this.getBearerToken(req)) {
            throw new HttpException('Already Logged In', HttpStatus.FORBIDDEN);
        }

        const bearerToken = await this.jwtService.sign(
            {
                data: user,
            },
            { expiresIn: 60 * 5 },
        );

        const refreshToken = await this.signRefreshToken({
            bearerToken: bearerToken,
            user: user,
        });

        await this.storeRefreshToken(res, refreshToken);

        return res.json({
            bearerToken: bearerToken,
            data: user,
        });
    }

    async refreshToken(req: any, res: any) {
        const bearerToken = this.getBearerToken(req);

        if (!bearerToken) {
            throw new HttpException('Bearer token not found', HttpStatus.UNAUTHORIZED);
        }

        try {
            this.jwtService.verify(bearerToken);

            return res.json({ bearerToken }); // send same bearerToken like after login
        } catch (e) {
            const refreshToken = req.signedCookies.refreshToken;

            if (refreshToken) {
                try {
                    const decodedRefreshToken = this.jwtService.verify(refreshToken);

                    if (decodedRefreshToken.bearerToken === bearerToken) {
                        const bearerToken = await this.jwtService.sign(
                            {
                                data: decodedRefreshToken.user,
                            },
                            { expiresIn: 60 * 5 },
                        );

                        const refreshToken = await this.signRefreshToken({
                            bearerToken: bearerToken,
                            user: decodedRefreshToken.user,
                        });

                        await this.storeRefreshToken(res, refreshToken);

                        return res.json({
                            bearerToken: bearerToken,
                            data: decodedRefreshToken.user,
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

    getBearerToken(req: any) {
        if (!req.headers.authorization) return null;

        const bearerToken = req.headers.authorization.split(' ');

        const name = bearerToken[0];
        const token = bearerToken[1];

        if (bearerToken.length && name === 'Bearer' && token) {
            return token;
        }
        return null;
    }

    async signRefreshToken(data: any) {
        return this.jwtService.sign(
            {
                ...data,
            },
            { expiresIn: 60 * 60 * 24 * 7 },
        );
    }

    // store in cookie
    async storeRefreshToken(res: any, token: any) {
        res.cookie('refreshToken', token, {
            maxAge: 60 * 60 * 24 * 7 * 1000,
            httpOnly: true,
            signed: true,
        });
    }
}
