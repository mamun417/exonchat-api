import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../prisma.service';
import { FacebookConnectDto } from './dto/facebook-connect.dto';
import { HttpService } from '@nestjs/axios';

@Injectable()
export class FacebookService {
    constructor(private prisma: PrismaService, private httpService: HttpService) {}

    async connect(req: any, facebookConnectDto: FacebookConnectDto) {
        const subscriberId = req.user.data.socket_session.subscriber_id;
        const socketSessionId = req.user.data.socket_session.id;

        // deactivate previous connected account if has for safe
        // later remove this block if you want multi account & page connection
        // for multi account & page you have to study full flow & alter conditions & data get
        await this.prisma.facebook_integration.updateMany({
            where: {
                user_id: { not: facebookConnectDto.auth_response.userID },
                subscriber_id: subscriberId,
            },
            data: {
                active: false,
            },
        });

        const longLivedUserToken: any = await this.httpService
            .get(
                `https://graph.facebook.com/oauth/access_token?grant_type=fb_exchange_token&client_id=629887308040741&client_secret=452e3db804a700102b70993214b7feb1&fb_exchange_token=${facebookConnectDto.auth_response.accessToken}`,
            )
            .toPromise();

        const userAccounts: any = await this.httpService
            .get(
                `https://graph.facebook.com/v11.0/${facebookConnectDto.auth_response.userID}/accounts?access_token=${longLivedUserToken.data.access_token}`,
            )
            .toPromise();

        // return { facebookConnectDto, longLivedUserToken: longLivedUserToken.data, userAccounts: userAccounts.data };

        return await this.prisma.facebook_integration.upsert({
            where: {
                facebook_integration_identifier: {
                    user_id: facebookConnectDto.auth_response.userID,
                    subscriber_id: subscriberId,
                },
            },
            create: {
                user_id: facebookConnectDto.auth_response.userID,
                user_info: facebookConnectDto.user_response,
                subscriber: { connect: { id: subscriberId } },
                facebook_secret: {
                    create: {
                        long_lived_access_token: longLivedUserToken.data.access_token,
                        long_lived_access_token_expires_in: longLivedUserToken.data.expires_in,
                    },
                },
                facebook_pages: {
                    create: [
                        userAccounts.data.data.map((page: any) => {
                            return {
                                create: {
                                    page_id: page.id,
                                    page_name: page.name,
                                    long_lived_access_token: page.access_token,
                                    page_info: {
                                        category: page.category,
                                        tasks: page.tasks,
                                        category_list: page.category_list,
                                    },
                                    subscriber: { connect: { id: subscriberId } },
                                },
                            };
                        }),
                    ],
                },
            },
            update: {
                user_info: facebookConnectDto.user_response,
                facebook_secret: {
                    update: {
                        long_lived_access_token: longLivedUserToken.data.access_token,
                        long_lived_access_token_expires_in: longLivedUserToken.data.expires_in,
                    },
                },
                facebook_pages: {
                    upsert: [
                        userAccounts.data.data.map((page: any) => {
                            return {
                                where: {
                                    facebook_pages_identifier: {
                                        page_id: page.id,
                                        subscriber_id: subscriberId,
                                    },
                                },
                                create: {
                                    page_id: page.id,
                                    page_name: page.name,
                                    long_lived_access_token: page.access_token,
                                    page_info: {
                                        category: page.category,
                                        tasks: page.tasks,
                                        category_list: page.category_list,
                                    },
                                    subscriber: { connect: { id: subscriberId } },
                                },
                                update: {
                                    page_name: page.name,
                                    long_lived_access_token: page.access_token,
                                    page_info: {
                                        category: page.category,
                                        tasks: page.tasks,
                                        category_list: page.category_list,
                                    },
                                },
                            };
                        }),
                    ],
                },
            },
            include: {
                facebook_pages: true,
                facebook_secret: true,
            },
        });
    }
}
