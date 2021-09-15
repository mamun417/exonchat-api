import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../prisma.service';
import { FacebookConnectDto } from './dto/facebook-connect.dto';
import { HttpService } from '@nestjs/axios';

import * as _l from 'lodash';
import { FacebookPageConnectionDto } from './dto/facebook-page-connection.dto';

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

        let userAccounts: any = await this.httpService
            .get(
                `https://graph.facebook.com/v11.0/${facebookConnectDto.auth_response.userID}/accounts?access_token=${longLivedUserToken.data.access_token}`,
            )
            .toPromise();

        const facebookIntegrationEntry = await this.prisma.facebook_integration.findUnique({
            where: {
                facebook_integration_identifier: {
                    user_id: facebookConnectDto.auth_response.userID,
                    subscriber_id: subscriberId,
                },
            },
            include: {
                facebook_pages: {
                    select: {
                        page_id: true,
                    },
                },
            },
        });

        let removablePageIds = [];

        if (facebookIntegrationEntry && facebookIntegrationEntry.facebook_pages?.length) {
            removablePageIds = _l.without(
                _l.map(facebookIntegrationEntry.facebook_pages, 'page_id'),
                ..._l.map(userAccounts.data.data, 'id'),
            );
        }

        // remove removable pages
        for (const pageId of removablePageIds) {
            await this.prisma.facebook_page.deleteMany({
                where: {
                    subscriber_id: subscriberId,
                    page_id: pageId,
                },
            });
        }

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
                    create: userAccounts.data.data.map((page: any) => {
                        return {
                            page_id: page.id,
                            page_name: page.name,
                            long_lived_access_token: page.access_token,
                            page_info: {
                                category: page.category,
                                tasks: page.tasks,
                                category_list: page.category_list,
                            },
                            subscriber: { connect: { id: subscriberId } },
                        };
                    }),
                },
            },
            update: {
                user_info: facebookConnectDto.user_response,
                active: true,
                facebook_secret: {
                    update: {
                        long_lived_access_token: longLivedUserToken.data.access_token,
                        long_lived_access_token_expires_in: longLivedUserToken.data.expires_in,
                    },
                },
                facebook_pages: {
                    upsert: userAccounts.data.data.map((page: any) => {
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
                },
            },
            include: {
                facebook_pages: { include: { chat_departments: true } },
                facebook_secret: true,
            },
        });
    }

    async disconnect(req: any) {
        const subscriberId = req.user.data.socket_session.subscriber_id;
        const socketSessionId = req.user.data.socket_session.id;

        // for now disconnecting all. if multi then pass id here like other controller
        return await this.prisma.facebook_integration.updateMany({
            where: {
                subscriber_id: subscriberId,
            },
            data: {
                active: false,
            },
        });
    }

    async updatePageConnection(id: any, req: any, facebookPageConnectionDto: FacebookPageConnectionDto) {
        const subscriberId = req.user.data.socket_session.subscriber_id;
        const socketSessionId = req.user.data.socket_session.id;

        const page = await this.prisma.facebook_page.findUnique({
            where: { id: id },
        });

        if (!page) {
            throw new HttpException(`facebook page not found`, HttpStatus.NOT_FOUND);
        }

        for (const departmentId of facebookPageConnectionDto.chat_department_ids) {
            const department = await this.prisma.chat_department.findUnique({
                where: {
                    id: departmentId,
                },
            });

            if (!department) {
                throw new HttpException(`chat department by id ${departmentId} not found`, HttpStatus.NOT_FOUND);
            }
        }

        await this.prisma.facebook_page.update({
            where: { id: id },
            data: {
                active: true,
                chat_departments: {
                    set: facebookPageConnectionDto.chat_department_ids.map((departmentId: any) => {
                        return { id: departmentId };
                    }),
                },
            },
        });

        return await this.prisma.facebook_integration.findMany({
            where: {
                active: true,
                subscriber_id: subscriberId,
            },
            include: {
                facebook_pages: { include: { chat_departments: true } },
            },
        });
    }

    async disconnectPage(id: any, req: any) {
        const subscriberId = req.user.data.socket_session.subscriber_id;
        const socketSessionId = req.user.data.socket_session.id;

        const page = await this.prisma.facebook_page.findUnique({
            where: { id: id },
        });

        if (!page) {
            throw new HttpException(`facebook page not found`, HttpStatus.NOT_FOUND);
        }

        await this.prisma.facebook_page.update({
            where: { id: id },
            data: {
                active: false,
            },
        });

        return await this.prisma.facebook_integration.findMany({
            where: {
                active: true,
                subscriber_id: subscriberId,
            },
            include: {
                facebook_pages: { include: { chat_departments: true } },
            },
        });
    }

    async accounts(req: any) {
        const subscriberId = req.user.data.socket_session.subscriber_id;
        const socketSessionId = req.user.data.socket_session.id;

        // for now it will return array with 1 entry. if you want multiple see connect comment
        return await this.prisma.facebook_integration.findMany({
            where: {
                active: true,
                subscriber_id: subscriberId,
            },
            include: {
                facebook_pages: { include: { chat_departments: true } },
            },
        });
    }
}
