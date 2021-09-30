import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../../prisma.service';
import { FacebookConnectDto } from './dto/facebook-connect.dto';
import { HttpService } from '@nestjs/axios';

import * as _l from 'lodash';
import { FacebookPageConnectionDto } from './dto/facebook-page-connection.dto';
import { EventsGateway } from '../../../../../events/events.gateway';

@Injectable()
export class FacebookService {
    constructor(private prisma: PrismaService, private httpService: HttpService, private ws: EventsGateway) {}

    async connect(req: any, facebookConnectDto: FacebookConnectDto) {
        const subscriberId = req.user.data.socket_session.subscriber_id;

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

        // rethink this situation. cz its causing conversation new create with same client same page
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
                facebook_pages: { include: { chat_department: true } },
                facebook_secret: true,
            },
        });
    }

    async disconnect(req: any) {
        const subscriberId = req.user.data.socket_session.subscriber_id;

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

        const page = await this.prisma.facebook_page.findUnique({
            where: { id: id },
        });

        if (!page) {
            throw new HttpException(`facebook page not found`, HttpStatus.NOT_FOUND);
        }

        const department = await this.prisma.chat_department.findUnique({
            where: {
                id: facebookPageConnectionDto.chat_department_id,
            },
        });

        if (!department) {
            throw new HttpException(
                `chat department by id ${facebookPageConnectionDto.chat_department_id} not found`,
                HttpStatus.NOT_FOUND,
            );
        }

        try {
            // we can call get request to check permission. if not found then we can call this
            const subscribed: any = await this.httpService
                .post(
                    `https://graph.facebook.com/v11.0/${page.page_id}/subscribed_apps?subscribed_fields=messages,message_echoes,message_deliveries,message_reads&access_token=${page.long_lived_access_token}`,
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

        // first generate a socket_session by the page id if not exists
        const socketSession = await this.prisma.socket_session.findFirst({
            where: {
                subscriber_id: page.subscriber_id,
                is_facebook_page: true,
                use_for: 'fb',
                use_for_id: page.page_id,
            },
        });

        if (!socketSession) {
            await this.prisma.socket_session.create({
                data: {
                    init_name: page.page_name,
                    init_ip: 'fb',
                    init_user_agent: 'fb',
                    use_for: 'fb',
                    use_for_id: page.page_id,
                    is_facebook_page: true,
                    subscriber: { connect: { id: page.subscriber_id } },
                },
            });
        }

        await this.prisma.facebook_page.update({
            where: { id: id },
            data: {
                active: true,
                updated_at: new Date(),
                chat_department: {
                    connect: { id: facebookPageConnectionDto.chat_department_id },
                },
            },
        });

        return await this.prisma.facebook_integration.findMany({
            where: {
                active: true,
                subscriber_id: subscriberId,
            },
            include: {
                facebook_pages: { include: { chat_department: true } },
            },
        });
    }

    async disconnectPage(id: any, req: any) {
        const subscriberId = req.user.data.socket_session.subscriber_id;

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
                facebook_pages: { include: { chat_department: true } },
            },
        });
    }

    async accounts(req: any) {
        const subscriberId = req.user.data.socket_session.subscriber_id;

        // for now it will return array with 1 entry. if you want multiple see connect comment
        return await this.prisma.facebook_integration.findMany({
            where: {
                active: true,
                subscriber_id: subscriberId,
            },
            include: {
                facebook_pages: { include: { chat_department: true } },
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
                        console.log('Unknown type', body);
                    }
                }
            } else {
                console.log('Unknown type', body);
            }
        } else {
            console.log('without page', body);
        }
    }

    async messageParser(messageObj: any, pageId: any) {
        if (messageObj.message) {
            if (messageObj.message.is_echo) {
                console.log('======is echo ====', messageObj);
                // echo {
                //     sender: { id: '109876438101376' },
                //     recipient: { id: '6076072989100802' },
                //     timestamp: 1632987769832,
                //         message: {
                //         mid: 'm_jmLtr07CL9cBucmYgcQyGDOVJ3z7jXIWGJe8nB23c9RsmzhiWR3TmVTb-5wfzwAn3ZQ7ZivrI2CD0r0odk-SbA',
                //             is_echo: true,
                //             text: 'ki hoise ki ehh',
                //             app_id: 263902037430900
                //     }
                // message from page user. its for if the page agents send msg from page then store msg in this also

                const result = await this.conversationInitiatedCheck(messageObj.sender.id, messageObj.recipient.id);

                if (result) {
                    const message: any = await this.prisma.message.create({
                        data: {
                            msg: messageObj.message.text,
                            created_at: new Date(messageObj.timestamp),
                            subscriber: { connect: { id: result.conversation.subscriber_id } },
                            conversation: { connect: { id: result.conversation.id } },
                            socket_session: { connect: { id: result.fbPageConversationSession.socket_session.id } },
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

                    this.ws.sendToSocketRooms(
                        this.ws.usersRoomBySubscriberId(message.subscriber_id, false),
                        'ec_msg_from_user',
                        {
                            ...message,
                        },
                    );
                }
            } else {
                const result = await this.createOrNotConversation(messageObj.recipient.id, messageObj.sender.id);

                if (result) {
                    // msg with attachment {
                    //     sender: { id: '6076072989100802' },
                    //     recipient: { id: '109876438101376' },
                    //     timestamp: 1633004893661,
                    //         message: {
                    //     mid: 'm_IEhf-3YrGmJJY-7765vRuTOVJ3z7jXIWGJe8nB23c9TQMquSEPBvmckzCxFsOC5McNwZCm8K0bbk9P61E2DP7w',
                    //         text: 'cho',
                    //         attachments: [ [Object] ]
                    // }
                    // } [
                    //     {
                    //         type: 'image',
                    //         payload: {
                    //             url: 'https://scontent.xx.fbcdn.net/v/t1.15752-9/242373856_402736624794611_2155155210394663206_n.png?_nc_cat=104&ccb=1-5&_nc_sid=58c789&_nc_ohc=MJ9kbWmMJpcAX9dNSdF&_nc_ad=z-m&_nc_cid=0&_nc_ht=scontent.xx&oh=75b0c4e3569133b55f7f3f916c2b55ea&oe=61797DC4'
                    //         }
                    //     }
                    // ]

                    console.log('saving new client msg', messageObj, messageObj.message.attachments);
                    const message: any = await this.prisma.message.create({
                        data: {
                            msg: messageObj.message.text,
                            created_at: new Date(messageObj.timestamp),
                            subscriber: { connect: { id: result.conversation.subscriber_id } },
                            conversation: { connect: { id: result.conversation.id } },
                            socket_session: { connect: { id: result.clientConversationSession.socket_session.id } },
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

                    this.ws.sendToSocketRooms(
                        this.ws.usersRoomBySubscriberId(message.subscriber_id, false),
                        'ec_msg_from_client',
                        {
                            ...message,
                            ai_is_replying: false,
                        },
                    );
                }
            }
        } else {
            // delivery from page res{
            //     sender: { id: '6076072989100802' },
            //     recipient: { id: '109876438101376' },
            //     timestamp: 1632987770284,
            //         delivery: {
            //     mids: [
            //         'm_jmLtr07CL9cBucmYgcQyGDOVJ3z7jXIWGJe8nB23c9RsmzhiWR3TmVTb-5wfzwAn3ZQ7ZivrI2CD0r0odk-SbA'
            //     ],
            //         watermark: 1632987769832
            // }
            // }

            // if has read key then seen fired
            // if has delivery then from page delivery fired
            console.log('other_type fb msg', messageObj);
        }
    }

    async conversationInitiatedCheck(pageId: string, clientId: string) {
        const fbPage = await this.prisma.facebook_page.findFirst({
            where: {
                active: true,
                page_id: pageId,
            },
            orderBy: { updated_at: 'desc' },
        });

        if (fbPage) {
            let conversation: any = await this.prisma.conversation.findFirst({
                where: {
                    subscriber_id: fbPage.subscriber_id,
                    facebook_page_id: fbPage.id,
                    conversation_sessions: {
                        some: {
                            socket_session: {
                                use_for_id: clientId,
                            },
                        },
                    },
                },
                include: {
                    conversation_sessions: { include: { socket_session: true } },
                },
            });

            return {
                conversation,
                fbPageConversationSession: _l.find(conversation.conversation_sessions, (convSes: any) => {
                    return !convSes.socket_session.user_id && convSes.socket_session.is_facebook_page;
                }),
            };
        }

        return null;
    }

    // usage from if client msg
    async createOrNotConversation(pageId: any, clientId: any) {
        const fbPage = await this.prisma.facebook_page.findFirst({
            where: {
                active: true,
                page_id: pageId,
            },
            orderBy: { updated_at: 'desc' },
        });

        if (fbPage) {
            // get conversation by client id
            let conversation: any = await this.prisma.conversation.findFirst({
                where: {
                    subscriber_id: fbPage.subscriber_id,
                    facebook_page_id: fbPage.id,
                    conversation_sessions: {
                        some: {
                            socket_session: {
                                use_for_id: clientId,
                            },
                        },
                    },
                },
                include: {
                    conversation_sessions: { include: { socket_session: true } },
                },
            });

            if (!conversation) {
                // get fb page session id
                const fbPageSession = await this.prisma.socket_session.findFirst({
                    where: {
                        subscriber_id: fbPage.subscriber_id,
                        is_facebook_page: true,
                        use_for: 'fb',
                        use_for_id: fbPage.page_id,
                    },
                });

                // create conversation session with client socket session
                // create conversation session & connect fb page session
                conversation = await this.prisma.conversation.create({
                    data: {
                        users_only: false,
                        type: 'facebook_chat',
                        chat_department: { connect: { id: fbPage.chat_department_id } },
                        subscriber: { connect: { id: fbPage.subscriber_id } },
                        facebook_page: { connect: { id: fbPage.id } },
                        created_by: { connect: { id: fbPageSession.id } },
                        conversation_sessions: {
                            create: [
                                {
                                    type: 'fb',
                                    joined_at: new Date(),
                                    socket_session: {
                                        create: {
                                            init_ip: 'fb',
                                            init_user_agent: '',
                                            use_for: 'fb',
                                            use_for_id: clientId,
                                            subscriber: { connect: { id: fbPage.subscriber_id } },
                                        },
                                    },
                                    subscriber: { connect: { id: fbPage.subscriber_id } },
                                },
                                {
                                    type: 'fb',
                                    joined_at: new Date(),
                                    socket_session: { connect: { id: fbPageSession.id } },
                                    subscriber: { connect: { id: fbPage.subscriber_id } },
                                },
                            ],
                        },
                    },
                    include: {
                        conversation_sessions: { include: { socket_session: true } },
                    },
                });

                this.ws.sendToSocketRooms(
                    this.ws.usersRoomBySubscriberId(conversation.subscriber_id, false),
                    'ec_conv_initiated_from_client',
                    {
                        data: { conv_data: conversation, conv_id: conversation.id },
                    },
                );
            }

            return {
                conversation,
                clientConversationSession: _l.find(conversation.conversation_sessions, (convSes: any) => {
                    return !convSes.socket_session.user_id && !convSes.socket_session.is_facebook_page;
                }),
            };
        }

        return null;
    }
}
