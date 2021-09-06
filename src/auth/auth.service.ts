import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
    constructor(private jwtService: JwtService, private prisma: PrismaService) {}

    async validateUserForLogin(login_info: any, pass: string): Promise<any> {
        // cookie size 4 kb, so include what we need
        const user: any = await this.prisma.user.findFirst({
            where: {
                email: login_info.email,
                subscriber: {
                    subscriber_meta: {
                        company_name: login_info.company_name,
                    },
                },
            },
            include: {
                user_meta: {
                    select: {
                        display_name: true,
                        full_name: true,
                    },
                },
                user_secret: true,
                role: {
                    select: {
                        id: true,
                        slug: true,
                        permissions: {
                            select: {
                                id: true,
                                slug: true,
                            },
                        },
                    },
                },
                subscriber: {
                    select: {
                        id: true,
                        subscriber_meta: {
                            select: {
                                company_name: true,
                                display_name: true,
                            },
                        },
                        subscriber_secret: {
                            select: {
                                api_key: true,
                            },
                        },
                    },
                },
                socket_session: {
                    select: {
                        id: true,
                        init_email: true,
                        init_ip: true,
                        subscriber_id: true,
                        user_id: true,
                    },
                },
                chat_departments: {
                    select: {
                        id: true,
                        tag: true,
                    },
                },
            },
        });

        if (!user) {
            throw new HttpException(`Invalid Login Credentials`, HttpStatus.NOT_FOUND);
        }

        if (user && (await bcrypt.compare(pass, user.user_secret.password))) {
            const { user_secret, ...result } = user;
            return result;
        }

        return null;
    }

    async login(user: any, req: any, res: any) {
        if (this.getBearerToken(req)) {
            throw new HttpException('Already Logged In', HttpStatus.FORBIDDEN);
        }

        // const bearerToken = this.createToken(user, 60 * 5);
        const bearerToken = this.createToken(user);

        const refreshToken = this.signRefreshToken({
            bearerToken: bearerToken,
            user: user,
        });

        this.storeRefreshToken(res, refreshToken);

        return res.json({
            bearerToken: bearerToken,
            data: user,
        });
    }

    createToken(data: any, expires = 60 * 60 * 24) {
        return this.jwtService.sign(
            {
                data,
            },
            { expiresIn: expires },
        );
    }

    verifyToken(token: any) {
        try {
            return this.jwtService.verify(token);
        } catch (e: any) {
            return null;
        }
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
            // console.log(req);

            const refreshToken = req.signedCookies.refreshToken;

            if (refreshToken) {
                try {
                    const decodedRefreshToken = this.jwtService.verify(refreshToken);

                    if (decodedRefreshToken.bearerToken === bearerToken) {
                        const bearerToken = this.jwtService.sign(
                            {
                                data: decodedRefreshToken.user,
                            },
                            // { expiresIn: 60 * 5 },
                            { expiresIn: 60 * 5 * 60 },
                        );

                        const refreshToken = this.signRefreshToken({
                            bearerToken: bearerToken,
                            user: decodedRefreshToken.user,
                        });

                        this.storeRefreshToken(res, refreshToken);

                        return res.json({
                            bearerToken: bearerToken,
                            data: decodedRefreshToken.user,
                        });
                    }

                    throw new HttpException('Invalid bearer token', HttpStatus.UNPROCESSABLE_ENTITY);
                } catch (e) {
                    throw new HttpException(e.message, HttpStatus.UNPROCESSABLE_ENTITY);
                }
            }

            throw new HttpException('Refresh token not found', HttpStatus.UNPROCESSABLE_ENTITY);
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

    signRefreshToken(data: any) {
        return this.jwtService.sign(
            {
                ...data,
            },
            { expiresIn: 60 * 60 * 24 * 7 },
        );
    }

    // store in cookie
    storeRefreshToken(res: any, token: any) {
        res.cookie('refreshToken', token, {
            maxAge: 60 * 60 * 24 * 7 * 1000,
            httpOnly: true,
            signed: true,
            sameSite: 'none',
            secure: true,
        });
    }
}
