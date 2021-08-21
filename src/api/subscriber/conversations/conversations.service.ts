import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

import { PrismaService } from 'src/prisma.service';

import { CreateConversationDto } from './dto/create-conversation.dto';

import { conversation } from '@prisma/client';
import { DataHelper } from 'src/helper/data-helper';
import { SocketSessionsService } from '../socket-session/socket-sessions.service';
import { ChatDepartmentService } from '../chat-department/department.service';
import { SettingsService } from '../settings/settings.service';
import { ConversationOtherInfoDto } from './dto/conversation-other-info.dto';
import { UpdateLastMsgSeenTimeDto } from './dto/update-last-msg-seen-time-.dto';
import { CloseConversationDto } from './dto/close-conversation.dto';

@Injectable()
export class ConversationsService {
    constructor(
        private prisma: PrismaService,
        private dataHelper: DataHelper,
        private settingsService: SettingsService,
        private socketSessionService: SocketSessionsService,
        private chatDepartmentService: ChatDepartmentService,
    ) {}

    async create(req: any, createConversationDto: CreateConversationDto) {
        const subscriberId = req.user.data.socket_session.subscriber_id;
        const socketSessionId = req.user.data.socket_session.id;

        let chatDepartmentConnector = {};

        // if client
        if (!req.user.data.socket_session.user_id) {
            if (createConversationDto.chat_type !== 'live_chat')
                throw new HttpException(`Doing something wrong`, HttpStatus.UNPROCESSABLE_ENTITY);

            const convBySesId = await this.prisma.conversation.findFirst({
                where: {
                    created_by_id: socketSessionId,
                },
            });

            if (convBySesId) throw new HttpException(`Already Created with this Session ID`, HttpStatus.CONFLICT);

            await this.prisma.socket_session.update({
                where: {
                    id: socketSessionId,
                },
                data: {
                    init_name: createConversationDto.name,
                    init_email: createConversationDto.email,
                    user_info: createConversationDto.user_info || {},
                },
            });

            await this.chatDepartmentService.findOneWithException(createConversationDto.department, req);

            chatDepartmentConnector = { chat_department: { connect: { id: createConversationDto.department } } };
        } else {
            if (createConversationDto.ses_ids.includes(socketSessionId))
                throw new HttpException(`Doing something wrong`, HttpStatus.UNPROCESSABLE_ENTITY);

            if (createConversationDto.chat_type === 'user_to_user_chat' && createConversationDto.ses_ids.length > 1)
                throw new HttpException(`Doing something wrong`, HttpStatus.UNPROCESSABLE_ENTITY);

            for (const ses_id of createConversationDto.ses_ids) {
                await this.socketSessionService.findOneWithException(ses_id, req); // also check is user
            }

            if (createConversationDto.chat_type === 'user_to_user_chat') {
                const conv = await this.prisma.conversation.findFirst({
                    where: {
                        users_only: true,
                        type: 'user_to_user_chat',
                        subscriber_id: subscriberId,
                        AND: [
                            {
                                conversation_sessions: {
                                    some: {
                                        socket_session_id: socketSessionId,
                                    },
                                },
                            },
                            {
                                conversation_sessions: {
                                    some: {
                                        socket_session_id: createConversationDto.ses_ids[0],
                                    },
                                },
                            },
                        ],
                    },
                    include: {
                        conversation_sessions: {
                            include: { socket_session: { include: { user: { include: { user_meta: true } } } } },
                        },
                        chat_department: true,
                    },
                });

                if (conv) {
                    // without error returning the same conv so that no extra api cost
                    // throw new HttpException(`Conv with that user already exists`, HttpStatus.CONFLICT);
                    return conv;
                }

                // call api if ai can reply

                return this.prisma.conversation.create({
                    data: {
                        users_only: true,
                        type: 'user_to_user_chat',
                        ai_is_replying: true, // naming this is good so that i dont have to convert states
                        conversation_sessions: {
                            create: [
                                {
                                    joined_at: new Date(),
                                    socket_session: {
                                        connect: { id: socketSessionId },
                                    },
                                    subscriber: {
                                        connect: { id: subscriberId },
                                    },
                                },
                                {
                                    joined_at: new Date(),
                                    socket_session: {
                                        connect: { id: createConversationDto.ses_ids[0] },
                                    },
                                    subscriber: {
                                        connect: { id: subscriberId },
                                    },
                                },
                            ],
                        },
                        created_by: { connect: { id: socketSessionId } },
                        subscriber: { connect: { id: subscriberId } },
                    },
                    include: {
                        conversation_sessions: {
                            include: { socket_session: { include: { user: { include: { user_meta: true } } } } },
                        },
                        chat_department: true,
                    },
                });
            } else {
                throw new HttpException(`Not implemented Yet`, HttpStatus.NOT_IMPLEMENTED);
            }
        }

        let ai_can_reply = false;
        let routingPolicy = 'manual';

        if (createConversationDto.chat_type === 'live_chat') {
            const aiReplySetting = await this.settingsService.findOne('ai_auto_reply_at_client_msg', req);

            if (aiReplySetting) {
                if (aiReplySetting && aiReplySetting.user_settings_value && aiReplySetting.user_settings_value.length) {
                    ai_can_reply = aiReplySetting.user_settings_value[0].value === 'true';
                } else {
                    ai_can_reply = aiReplySetting.default_value === 'true';
                }
            }

            // get by category & other info. send also routing info
            const routingPolicySetting = await this.settingsService.findOne(
                'conversation_at_initiate_notify_policy',
                req,
            );

            if (routingPolicySetting) {
                if (
                    routingPolicySetting &&
                    routingPolicySetting.user_settings_value &&
                    routingPolicySetting.user_settings_value.length
                ) {
                    routingPolicy = routingPolicySetting.user_settings_value[0].value;
                } else {
                    routingPolicy = routingPolicySetting.default_value;
                }
            }
        }

        const conversation: any = await this.prisma.conversation.create({
            data: {
                users_only: createConversationDto.chat_type !== 'live_chat',
                type: createConversationDto.chat_type,
                ai_is_replying: ai_can_reply,
                conversation_sessions: {
                    create: {
                        joined_at: new Date(),
                        socket_session: {
                            connect: { id: socketSessionId },
                        },
                        subscriber: {
                            connect: { id: subscriberId },
                        },
                    },
                },
                subscriber: {
                    connect: { id: subscriberId },
                },
                created_by: {
                    connect: { id: socketSessionId },
                },
                ...chatDepartmentConnector,
            },
            include: {
                conversation_sessions: {
                    include: { socket_session: { include: { user: { include: { user_meta: true } } } } },
                },
                chat_department: true,
            },
        });

        const logMessage = await this.prisma.message.create({
            data: {
                msg: 'initiate',
                message_type: 'log',
                socket_session: { connect: { id: socketSessionId } },
                conversation: { connect: { id: conversation.id } },
                subscriber: { connect: { id: subscriberId } },
            },
        });

        conversation.routing_policy = routingPolicy;
        conversation.log_message = logMessage;

        return conversation;
    }

    async join(id: string, req: any) {
        const subscriberId = req.user.data.subscriber_id;
        const socketSessionId = req.user.data.socket_session.id;

        const conversation = await this.findOneWithException(id, { subscriber_id: subscriberId });

        const convSes = await this.prisma.conversation_session.findFirst({
            where: {
                conversation_id: conversation.id,
                socket_session_id: socketSessionId,
            },
        });

        if (convSes && !convSes.left_at)
            throw new HttpException(`Already joined to this conversation`, HttpStatus.CONFLICT);

        await this.prisma.conversation.update({
            where: {
                id: conversation.id,
            },
            data: {
                ai_is_replying: false,
            },
        });

        let convSesRes: any;

        if (!convSes) {
            convSesRes = await this.prisma.conversation_session.create({
                data: {
                    joined_at: new Date(),
                    subscriber: {
                        connect: { id: subscriberId },
                    },
                    socket_session: {
                        connect: { id: socketSessionId },
                    },
                    conversation: {
                        connect: { id: conversation.id },
                    },
                },
                include: {
                    socket_session: {
                        include: {
                            user: { include: { user_meta: true } },
                        },
                    },
                },
            });
        } else {
            convSesRes = await this.prisma.conversation_session.update({
                where: {
                    id: convSes.id,
                },
                data: {
                    joined_at: new Date(),
                    left_at: null,
                },
                include: {
                    socket_session: {
                        include: {
                            user: { include: { user_meta: true } },
                        },
                    },
                },
            });
        }

        convSesRes.log_message = await this.prisma.message.create({
            data: {
                msg: 'joined',
                message_type: 'log',
                socket_session: { connect: { id: socketSessionId } },
                conversation: { connect: { id: conversation.id } },
                subscriber: { connect: { id: subscriberId } },
            },
        });

        return convSesRes;
    }

    async leave(id: string, req: any) {
        const subscriberId = req.user.data.socket_session.subscriber_id;
        const socketSessionId = req.user.data.socket_session.id;

        const conversation = await this.findOneWithException(id, {
            subscriber_id: subscriberId,
        });

        const updated = await this.prisma.conversation_session.updateMany({
            where: {
                conversation_id: conversation.id,
                socket_session_id: socketSessionId,
                left_at: null,
            },
            data: {
                left_at: new Date(),
            },
        });

        if (!updated.count) {
            throw new HttpException(`Already left from this conversation`, HttpStatus.CONFLICT);
        }

        const convSesRes: any = await this.prisma.conversation_session.findUnique({
            where: {
                conv_ses_identifier: {
                    conversation_id: conversation.id,
                    socket_session_id: socketSessionId,
                },
            },
            include: {
                socket_session: {
                    include: {
                        user: { include: { user_meta: true } },
                    },
                },
            },
        });

        convSesRes.log_message = await this.prisma.message.create({
            data: {
                msg: 'left',
                message_type: 'log',
                socket_session: { connect: { id: socketSessionId } },
                conversation: { connect: { id: conversation.id } },
                subscriber: { connect: { id: subscriberId } },
            },
        });

        return convSesRes;
    }

    async close(id: string, req: any, closeConversationDto: CloseConversationDto) {
        const subscriberId = req.user.data.socket_session.subscriber_id;
        const socketSessionId = req.user.data.socket_session.id;

        const conversation = await this.findOneWithException(id, {
            subscriber_id: subscriberId,
        });

        if (conversation.closed_at) {
            throw new HttpException('Already closed from this conversation', HttpStatus.CONFLICT);
        }

        const convSes = await this.prisma.conversation_session.findFirst({
            where: {
                conversation_id: id,
                socket_session_id: socketSessionId,
            },
        });

        const convRes: any = await this.prisma.conversation.update({
            where: {
                id: id,
            },
            data: {
                closed_by: {
                    connect: {
                        id: socketSessionId,
                    },
                },
                conversation_sessions: {
                    update: {
                        where: { id: convSes.id },
                        data: {
                            closed_reason: closeConversationDto.closed_reason || '',
                        },
                    },
                },
                closed_at: new Date(Date.now() + 1000),
            },
            include: {
                closed_by: {
                    include: {
                        user: { include: { user_meta: true } },
                    },
                },
                conversation_sessions: {
                    include: {
                        socket_session: {
                            include: {
                                user: { include: { user_meta: true } },
                            },
                        },
                    },
                },
            },
        });

        convRes.log_message = await this.prisma.message.create({
            data: {
                msg: 'closed',
                message_type: 'log',
                socket_session: { connect: { id: socketSessionId } },
                conversation: { connect: { id: conversation.id } },
                subscriber: { connect: { id: subscriberId } },
            },
        });

        return convRes;
    }

    async conversationUpdateOtherInfo(id: string, req: any, conversationOtherInfo: ConversationOtherInfoDto) {
        const subscriberId = req.user.data.socket_session.subscriber_id;
        const socketSessionId = req.user.data.socket_session.id;

        const conversation = await this.findOneWithException(id, { subscriber_id: subscriberId });

        const otherInfo = conversation.other_info || {};

        otherInfo['notify_to'] = conversationOtherInfo.notify_to_value;

        return this.prisma.conversation.update({
            where: { id: conversation.id },
            data: { other_info: otherInfo },
        });
    }

    async findAll(req: any): Promise<conversation[]> {
        return this.prisma.conversation.findMany({
            where: {
                subscriber_id: req.user.data.subscriber_id,
            },
            orderBy: {
                created_at: 'desc',
            },
        });
    }

    async clientsConversations(req: any, query: any) {
        const relationContainsObj = {
            contains: query.s,
            mode: 'insensitive',
        };

        const filterHelper = this.dataHelper.paginationAndFilter(
            [
                'p',
                'pp',
                {
                    name: 's',
                    type: 'static_relation',
                    relation: {
                        OR: [
                            {
                                conversation_sessions: {
                                    some: {
                                        socket_session: {
                                            OR: [
                                                { init_name: relationContainsObj },
                                                { init_email: relationContainsObj },
                                            ],
                                        },
                                    },
                                },
                            },
                            {
                                chat_department: {
                                    tag: relationContainsObj,
                                },
                            },
                        ],
                    },
                },
            ],
            query,
        );

        const whereQuery = {
            subscriber_id: req.user.data.subscriber_id,
            users_only: false,
            messages: { some: {} },
            ...filterHelper.where,
        };

        const count = await this.prisma.conversation.count({
            where: whereQuery,
        });

        const result = await this.prisma.conversation.findMany({
            where: whereQuery,
            include: {
                conversation_sessions: {
                    include: {
                        socket_session: {
                            include: {
                                user: { include: { user_meta: true } },
                            },
                        },
                    },
                },
                messages: {
                    where: {
                        socket_session: {
                            user_id: null,
                        },
                    },
                    take: 1,
                    orderBy: {
                        updated_at: 'desc',
                    },
                    include: { attachments: true },
                },
                chat_department: true,
                closed_by: { include: { user: true } },
            },
            orderBy: {
                // currently orderby does not work for many entry
                // like here i needed messages orderby time
                updated_at: 'desc',
            },
            ...filterHelper.pagination,
        });

        return {
            conversations: {
                data: result,
                pagination: {
                    current_page: query.hasOwnProperty('p') ? parseInt(query.p) : 1,
                    total_page: Math.ceil(count / (query.hasOwnProperty('pp') ? parseInt(query.pp) : 10)),
                    total: count,
                },
            },
        };
    }

    async chatHistory(req: any, query: any) {
        const relationContainsObj = {
            contains: query.s,
            mode: 'insensitive',
        };

        const filterHelper = this.dataHelper.paginationAndFilter(
            [
                'p',
                'pp',
                {
                    name: 's',
                    type: 'static_relation',
                    relation: {
                        OR: [
                            {
                                conversation_sessions: {
                                    some: {
                                        socket_session: {
                                            OR: [
                                                { init_name: relationContainsObj },
                                                { init_email: relationContainsObj },
                                            ],
                                        },
                                    },
                                },
                            },
                            {
                                chat_department: {
                                    tag: relationContainsObj,
                                },
                            },
                        ],
                    },
                },
            ],
            query,
        );

        const whereQuery = {
            NOT: { closed_at: null },
            subscriber_id: req.user.data.subscriber_id,
            users_only: false,
            ...filterHelper.where,
        };

        const count = await this.prisma.conversation.count({
            where: whereQuery,
        });

        const result = await this.prisma.conversation.findMany({
            where: whereQuery,
            include: {
                conversation_sessions: {
                    include: {
                        socket_session: {
                            include: {
                                user: { include: { user_meta: true } },
                            },
                        },
                    },
                },
                messages: {
                    where: {
                        socket_session: {
                            user_id: null,
                        },
                    },
                    take: 1,
                    orderBy: {
                        updated_at: 'desc',
                    },
                    include: { attachments: true },
                },
                chat_department: true,
                closed_by: { include: { user: true } },
                conversation_rating: true,
            },
            orderBy: {
                // currently orderby does not work for many entry
                // like here i needed messages orderby time
                updated_at: 'desc',
            },
            ...filterHelper.pagination,
        });

        return {
            chat_histories: {
                data: result,
                pagination: {
                    current_page: query.hasOwnProperty('p') ? parseInt(query.p) : 1,
                    total_page: Math.ceil(count / (query.hasOwnProperty('pp') ? parseInt(query.pp) : 10)),
                    total: count,
                },
            },
        };
    }

    async clientConversation(id: any, req: any, query: any) {
        return this.prisma.conversation.findFirst({
            where: {
                id: id,
                subscriber_id: req.user.data.subscriber_id,
                users_only: false,
                messages: { some: {} },
            },
            include: {
                conversation_sessions: {
                    include: {
                        socket_session: {
                            include: {
                                user: { include: { user_meta: true } },
                            },
                        },
                    },
                },
                messages: {
                    take: 1,
                    orderBy: {
                        updated_at: 'desc',
                    },
                },
                chat_department: true,
                closed_by: { include: { user: true } },
            },
        });
    }

    async clientPreviousConversations(req: any, query: any) {
        return this.prisma.conversation.findMany({
            where: {
                subscriber_id: req.user.data.subscriber_id,
                users_only: false,
                // closed_by_id: null, // uncomment if needed
                messages: { some: {} },
                conversation_sessions: {
                    some: {
                        socket_session: {
                            OR: [{ init_email: query.email }], // other field or field email check
                            user_id: null,
                        },
                    },
                },
            },
            include: {
                messages: {
                    take: 1,
                    orderBy: {
                        updated_at: 'asc',
                    },
                },
            },
        });
    }

    async clientPreviousConversationsCount(req: any, query: any) {
        const count = await this.prisma.conversation.count({
            where: {
                subscriber_id: req.user.data.subscriber_id,
                users_only: false,
                // closed_by_id: null, // uncomment if needed
                conversation_sessions: {
                    some: {
                        socket_session: {
                            OR: [{ init_email: query.email }], // other field or field email check
                            user_id: null,
                        },
                    },
                },
            },
        });

        return { count };
    }

    async findAllUserToUserConvWithMe(req: any) {
        return this.prisma.conversation.findMany({
            where: {
                subscriber_id: req.user.data.subscriber_id,
                users_only: true,
                type: 'user_to_user_chat',
                conversation_sessions: {
                    some: {
                        socket_session_id: req.user.data.socket_session.id,
                    },
                },
            },
            include: {
                conversation_sessions: {
                    include: {
                        socket_session: {
                            include: {
                                user: { include: { user_meta: true } },
                            },
                        },
                    },
                },
                messages: {
                    take: 1,
                    orderBy: {
                        updated_at: 'desc',
                    },
                    include: { attachments: true },
                },
                chat_department: true,
                closed_by: { include: { user: true } },
            },
            orderBy: {
                updated_at: 'desc',
            },
        });
    }

    async someJoinedConvWithClient(req: any) {
        return this.prisma.conversation.findMany({
            where: {
                subscriber_id: req.user.data.subscriber_id,
                users_only: false,
                closed_at: null,
                conversation_sessions: {
                    some: {
                        socket_session: {
                            user_id: {
                                not: null,
                            },
                        },
                    },
                },
            },
            include: {
                conversation_sessions: {
                    include: { socket_session: { include: { user: { include: { user_meta: true } } } } },
                },
                chat_department: true,
                messages: {
                    where: { socket_session_id: { not: null } },
                    include: { attachments: true },
                    orderBy: { created_at: 'desc' },
                    take: 1,
                },
                closed_by: { include: { user: true } },
            },
            orderBy: { created_at: 'desc' },
        });
    }

    async someJoinedMyConvWithClient(req: any) {
        return this.prisma.conversation.findMany({
            where: {
                subscriber_id: req.user.data.subscriber_id,
                users_only: false,
                closed_at: null,
                conversation_sessions: {
                    some: {
                        socket_session: {
                            user_id: req.user.data.id,
                        },
                    },
                },
            },
            include: {
                conversation_sessions: {
                    include: { socket_session: { include: { user: { include: { user_meta: true } } } } },
                },
                chat_department: true,
                messages: {
                    where: { socket_session_id: { not: null } },
                    include: { attachments: true },
                    orderBy: { created_at: 'desc' },
                    take: 10,
                },
                closed_by: { include: { user: true } },
            },
            orderBy: { created_at: 'desc' },
        });
    }

    async someLeftMyConvWithClient(req: any) {
        return this.prisma.conversation.findMany({
            where: {
                subscriber_id: req.user.data.subscriber_id,
                users_only: false,
                closed_at: {
                    not: null,
                },
                messages: { some: {} },
                conversation_sessions: {
                    every: {
                        socket_session: {
                            user_id: req.user.data.id,
                        },
                    },
                },
            },
            orderBy: { created_at: 'desc' },
            take: 10,
        });
    }

    async someClosedConvWithClient(req: any) {
        return this.prisma.conversation.findMany({
            where: {
                subscriber_id: req.user.data.subscriber_id,
                users_only: false,
                closed_at: {
                    not: null,
                },
            },
            orderBy: { created_at: 'desc' },
            take: 10,
        });
    }

    async someClosedMyConvWithClient(req: any) {
        return this.prisma.conversation.findMany({
            where: {
                subscriber_id: req.user.data.subscriber_id,
                users_only: false,
                closed_at: {
                    not: null,
                },
                messages: { some: {} },
                conversation_sessions: {
                    every: {
                        socket_session: {
                            user_id: req.user.data.id,
                        },
                    },
                },
            },
            orderBy: { created_at: 'desc' },
            take: 10,
        });
    }

    async chatRequests(req: any) {
        return this.prisma.conversation.findMany({
            where: {
                subscriber_id: req.user.data.subscriber_id,
                users_only: false,
                conversation_sessions: {
                    every: {
                        socket_session: {
                            user_id: null,
                        },
                    },
                },
                closed_at: null,
            },
            include: {
                conversation_sessions: {
                    include: { socket_session: { include: { user: { include: { user_meta: true } } } } },
                },
                chat_department: true,
                messages: {
                    where: { socket_session_id: { not: null } },
                    include: { attachments: true },
                    orderBy: { created_at: 'desc' },
                    take: 1,
                },
                closed_by: { include: { user: true } },
            },
            orderBy: { created_at: 'desc' },
        });
    }

    async findOneWithSessions(id: string, req: any) {
        const conversation: any = await this.prisma.conversation.findFirst({
            where: {
                id: id,
                subscriber_id: req.user.data.socket_session.subscriber_id,
            },
            include: {
                closed_by: {
                    include: {
                        user: true,
                    },
                },
                conversation_sessions: {
                    include: {
                        socket_session: {
                            include: {
                                user: true,
                            },
                        },
                    },
                },
                chat_department: true,
            },
        });

        let routingPolicy = 'manual';
        // if we face issue conversation.conversation_sessions.length === 1 then rethink the use
        if (
            conversation &&
            conversation.conversation_sessions.length === 1 &&
            !conversation.users_only &&
            conversation.type === 'live_chat'
        ) {
            const routingPolicySetting = await this.settingsService.findOne(
                'conversation_at_initiate_notify_policy',
                req,
            );

            if (routingPolicySetting) {
                if (
                    routingPolicySetting &&
                    routingPolicySetting.user_settings_value &&
                    routingPolicySetting.user_settings_value.length
                ) {
                    routingPolicy = routingPolicySetting.user_settings_value[0].value;
                } else {
                    routingPolicy = routingPolicySetting.default_value;
                }
            }

            conversation.routing_policy = routingPolicy;
        }

        return conversation;
    }

    // async findOneWithStatus(id: string, req: any) {
    //     const conv: any = await this.prisma.conversation.findFirst({
    //         where: {
    //             id: id,
    //             subscriber_id: req.user.data.subscriber_id,
    //         },
    //         include: {
    //             conversation_sessions: true,
    //         },
    //     });

    //     // it doesnt matter if you are left or not
    //     if (conv.closed_at) {
    //         conv.status = 'closed';
    //     }

    //     const leftConvByMe = this.prisma.conversation.findFirst({
    //         where: {
    //             id: id,
    //             subscriber_id: req.user.data.subscriber_id,
    //             conversation_sessions: {
    //                 some: {
    //                     // some or every could be problemetic. try other way to check this
    //                     // ex. get socket_session_id
    //                     left_at: { not: null },
    //                     socket_session: {
    //                         user_id: req.user.data.id,
    //                     },
    //                 },
    //             },
    //         },
    //     });

    //     if (leftConvByMe) {
    //         conv.status = 'left';
    //     }

    //     // frontend check all conversation_sessions left_at.
    //     // if all not null then show all left but conv not close
    //     // if no status then unknown
    //     return conv;
    // }

    async findOne(id: string, extraQueries: any = {}, joins: any = {}): Promise<conversation> {
        return this.prisma.conversation.findFirst({
            where: {
                id: id,
                ...extraQueries,
            },
            ...joins,
        });
    }

    async findOneWithException(
        id: string,
        extraQueries: any = {},
        joins: any = {},
        errMsg = '',
    ): Promise<conversation> {
        return await this.dataHelper.getSingleDataWithException(
            async () => await this.findOne(id, extraQueries, joins),
            'conversation',
            errMsg,
        );
    }

    async conversationMessages(id: string, req: any, query: any) {
        const conversation = await this.findOneWithException(id, {
            subscriber_id: req.user.data.socket_session.subscriber_id,
        });

        const filterHelper = this.dataHelper.paginationAndFilter(['p', 'pp'], query);

        const result = await this.prisma.conversation.findUnique({
            where: { id: conversation.id },
            include: {
                messages: {
                    include: { attachments: true },
                    orderBy: { created_at: 'desc' },
                    ...filterHelper.pagination,
                },
                conversation_sessions: {
                    include: { socket_session: { include: { user: { include: { user_meta: true } } } } },
                },
                chat_department: true,
                closed_by: { include: { user: { include: { user_meta: true } } } },
                conversation_rating: true,
            },
        });

        return {
            conversation: {
                data: result,
                pagination: {
                    current_page: query.hasOwnProperty('p') ? parseInt(query.p) : 1,
                },
            },
        };
    }

    async updateLastMsgSeenTime(id: string, req: any, updateLastMsgSeenTimeDto: UpdateLastMsgSeenTimeDto) {
        return await this.prisma.conversation_session.update({
            where: { id: id },
            data: {
                last_msg_seen_time: updateLastMsgSeenTimeDto.last_msg_seen_time,
            },
        });
    }

    // update(id: number, updateConversationDto: UpdateConversationDto) {
    //     return `This action updates a #${id} conversation`;
    // }

    // remove(id: number) {
    //     return `This action removes a #${id} conversation`;
    // }
}
