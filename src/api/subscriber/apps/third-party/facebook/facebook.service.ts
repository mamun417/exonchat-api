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

        // remove facebook_pages for safety
        await this.prisma.facebook_page.deleteMany({
            where: {
                subscriber_id: subscriberId,
                temp_user_id: facebookConnectDto.auth_response.userID,
            },
        });

        const longLivedUserToken: any = await this.httpService
            .get(
                `https://graph.facebook.com/oauth/access_token?grant_type=fb_exchange_token&client_id=1033239004116693&client_secret=0c009fcfcc684b4360559a391efb5bab&fb_exchange_token=${facebookConnectDto.auth_response.accessToken}`,
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
                            temp_user_id: facebookConnectDto.auth_response.userID,
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
                                    temp_user_id: facebookConnectDto.auth_response.userID,
                                    subscriber_id: subscriberId,
                                },
                            },
                            create: {
                                page_id: page.id,
                                page_name: page.name,
                                long_lived_access_token: page.access_token,
                                temp_user_id: facebookConnectDto.auth_response.userID,
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
        // a page can be used in many app
        // dont give support a page to use for other subscribers. if not active then can be used
        // we have to store data so this is a huge problem
        // so try to limit by 1 for a page to be active
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

        try {
            // we can call get request to check permission. if not found then we can call this
            const subscribed: any = await this.httpService
                .post(
                    `https://graph.facebook.com/v11.0/${page.page_id}/subscribed_apps?subscribed_fields=messages,message_deliveries,message_echoes&access_token=${page.long_lived_access_token}`,
                )
                .toPromise();

            console.log(subscribed.data);

            if (subscribed.data?.success !== true) {
                throw new HttpException(`facebook page message subscription failed`, HttpStatus.NOT_FOUND);
            }
        } catch (e: any) {
            console.log(e.response);
            throw new HttpException(e.response.data?.error?.message, HttpStatus.NOT_FOUND);
        }

        await this.prisma.facebook_page.update({
            where: { id: id },
            data: {
                active: true,
                updated_at: new Date(),
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

    async facebookWebhookPost(req: any, body: any) {
        if (body.object === 'page') {
            if (body.entry && _l.isArray(body.entry) && body.entry.length) {
                for (const entry of body.entry) {
                    const pageId = entry.id;

                    if (entry.messaging && _l.isArray(entry.messaging) && entry.messaging.length) {
                        for (const messageObj of entry.messaging) {
                            await this.messageParser(messageObj, pageId);
                        }
                    } else {
                        console.log('Unknown type');
                        console.log(body);
                    }
                }
            } else {
                console.log('Unknown type');
                console.log(body);
            }
        } else {
            console.log('without page');
            console.log(body);
        }
    }

    async messageParser(messageObj: any, pageId: any) {
        if (messageObj.message) {
            if (messageObj.message.is_echo) {
                // message from page user. its for if the page agents send msg from page then store msg in this also
            } else {
                const result = await this.createOrNotConversation(messageObj.recipient.id, messageObj.sender.id);

                if (result) {
                    this.prisma.message.create({
                        data: {
                            msg: messageObj.message.text,
                            subscriber: { connect: { id: result.conversation.subscriber_id } },
                            conversation: { connect: { id: result.conversation.id } },
                            socket_session: { connect: { id: result.socket_session.id } },
                        },
                        include: {
                            attachments: true,
                            conversation: {
                                include: {
                                    conversation_sessions: {
                                        include: {
                                            socket_session: { include: { user: { include: { user_meta: true } } } },
                                        },
                                    },
                                    chat_department: true,
                                    closed_by: { include: { user: { include: { user_meta: true } } } },
                                },
                            },
                        },
                    });
                }
            }
        } else {
            console.log('other_type fb msg');
        }
    }

    async createOrNotConversation(pageId: any, clientId: any) {
        const fbPage = await this.prisma.facebook_page.findFirst({
            where: {
                active: true,
                page_id: pageId,
            },
            orderBy: { updated_at: 'desc' },
        });

        if (fbPage) {
            let socketSession = await this.prisma.socket_session.findFirst({
                where: {
                    use_for: 'fb',
                    use_for_id: clientId,
                    subscriber_id: fbPage.subscriber_id,
                },
            });

            if (!socketSession) {
                socketSession = await this.prisma.socket_session.create({
                    data: {
                        init_ip: 'fb',
                        init_user_agent: '',
                        use_for: 'fb',
                        use_for_id: clientId,
                        subscriber: {
                            connect: { id: fbPage.subscriber_id },
                        },
                    },
                });
            }

            let conversationSession = await this.prisma.conversation_session.findFirst({
                where: {
                    subscriber_id: fbPage.subscriber_id,
                    socket_session_id: socketSession.id,
                    type: 'fb',
                },
            });

            if (!conversationSession) {
                conversationSession = await this.prisma.conversation_session.create({
                    data: {
                        type: 'fb',
                        joined_at: new Date(),
                        socket_session: { connect: { id: socketSession.id } },
                        subscriber: { connect: { id: fbPage.subscriber_id } },
                        conversation: {
                            create: {
                                users_only: false,
                                type: 'facebook_chat',
                                created_by: { connect: { id: socketSession.id } },
                                subscriber: { connect: { id: fbPage.subscriber_id } },
                            },
                        },
                    },
                });
            }

            const conversation = await this.prisma.conversation.findUnique({
                where: {
                    id: conversationSession.conversation_id,
                },
                include: {
                    conversation_sessions: { include: { socket_session: true } },
                },
            });

            return {
                conversation: conversation,
                conversation_session: conversationSession,
                socket_session: socketSession,
            };
        }

        return null;
    }
}
