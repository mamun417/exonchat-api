import { HttpException, HttpStatus, Injectable, Post } from '@nestjs/common';

import { PrismaService } from 'src/prisma.service';

import { CreateConversationDto } from './dto/create-conversation.dto';

import { conversation } from '@prisma/client';
import { DataHelper } from 'src/helper/data-helper';
import { SocketSessionsService } from '../socket-session/socket-sessions.service';

@Injectable()
export class ConversationsService {
    constructor(
        private prisma: PrismaService,
        private dataHelper: DataHelper,
        private socketSessionService: SocketSessionsService,
    ) {}

    async create(req: any, createConversationDto: CreateConversationDto) {
        const subscriberId = req.user.data.subscriber_id;
        const socketSessionId = req.user.data.id;

        // if client
        if (!req.user.data.user_id) {
            const convBySesId = await this.prisma.conversation.findFirst({
                where: {
                    created_by_id: socketSessionId,
                },
            });

            if (convBySesId) throw new HttpException(`Already Created with this Session ID`, HttpStatus.CONFLICT);
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
                        conversation_sessions: {
                            some: {
                                socket_session_id: createConversationDto.ses_ids[0],
                            },
                        },
                    },
                });

                if (conv) {
                    throw new HttpException(`Conv with that user already exists`, HttpStatus.CONFLICT);
                }

                return this.prisma.conversation.create({
                    data: {
                        users_only: true,
                        type: 'user_to_user_chat',
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
                });
            } else {
                throw new HttpException(`Not implemented Yet`, HttpStatus.NOT_IMPLEMENTED);
            }
        }

        return this.prisma.conversation.create({
            data: {
                users_only: createConversationDto.chat_type === 'live_chat' ? false : true,
                type: createConversationDto.chat_type,
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
            },
        });
    }

    async join(id: string, req: any) {
        const subscriberId = req.user.data.subscriber_id;
        const socketSessionId = req.user.data.id;

        const conversation = await this.findOneWithException(id, { subscriber_id: subscriberId });

        const convSes = await this.prisma.conversation_session.findFirst({
            where: {
                conversation_id: conversation.id,
                socket_session_id: socketSessionId,
                left_at: null,
            },
        });

        if (convSes) throw new HttpException(`Already joined to this conversation`, HttpStatus.CONFLICT);

        return this.prisma.conversation_session.create({
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
                        user: true,
                    },
                },
            },
        });
    }

    async leave(id: string, req: any) {
        const subscriberId = req.user.data.subscriber_id;
        const socketSessionId = req.user.data.id;

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

        return this.prisma.conversation_session.findUnique({
            where: {
                conv_ses_identifier: {
                    conversation_id: conversation.id,
                    socket_session_id: socketSessionId,
                },
            },
            include: {
                socket_session: {
                    include: {
                        user: true,
                    },
                },
            },
        });
    }

    async close(id: string, req: any) {
        const subscriberId = req.user.data.subscriber_id;
        const socketSessionId = req.user.data.id;

        const conversation = await this.findOneWithException(id, {
            subscriber_id: subscriberId,
        });

        if (conversation.closed_at) {
            throw new HttpException('Already closed from this conversation', HttpStatus.CONFLICT);
        }

        return await this.prisma.conversation.update({
            where: {
                id: id,
            },
            data: {
                closed_at: new Date(),
                closed_by: {
                    connect: {
                        id: socketSessionId,
                    },
                },
                conversation_sessions: {
                    updateMany: {
                        where: {
                            left_at: null,
                        },
                        data: {
                            left_at: new Date(),
                        },
                    },
                },
            },
            include: {
                closed_by: {
                    include: {
                        user: true,
                    },
                },
            },
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

    async findAllUserToUserConvWithMe(req: any) {
        return this.prisma.conversation.findMany({
            where: {
                subscriber_id: req.user.data.subscriber_id,
                users_only: true,
                type: 'user_to_user_chat',
                conversation_sessions: {
                    every: {
                        socket_session_id: req.user.data.id,
                    },
                },
            },
            include: {
                conversation_sessions: true,
            },
        });
    }

    async someJoinedConvWithClient(req: any) {
        return this.prisma.conversation.findMany({
            where: {
                subscriber_id: req.user.data.subscriber_id,
                users_only: false,
                closed_at: null,
                messages: { some: {} },
                conversation_sessions: {
                    every: {
                        socket_session: {
                            user_id: {
                                not: null,
                            },
                        },
                    },
                },
            },
            orderBy: { created_at: 'desc' },
            take: 10,
        });
    }

    async someJoinedMyConvWithClient(req: any) {
        return this.prisma.conversation.findMany({
            where: {
                subscriber_id: req.user.data.subscriber_id,
                users_only: false,
                closed_at: null,
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
                messages: { some: {} },
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
                messages: { some: {} },
                closed_at: null,
            },
            include: {
                messages: {
                    take: 1,
                },
            },
            orderBy: { created_at: 'desc' },
        });
    }

    async findOneWithSessions(id: string, req: any) {
        return this.prisma.conversation.findFirst({
            where: {
                id: id,
                subscriber_id: req.user.data.subscriber_id,
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
            },
        });
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

    async conversationMessages(id: string, req: any) {
        const conversation = await this.findOneWithException(id, {
            subscriber_id: req.user.data.subscriber_id,
        });

        return this.prisma.message.findMany({
            where: {
                conversation_id: conversation.id,
            },
            orderBy: { created_at: 'desc' },
            include: {
                socket_session: {
                    include: {
                        user: true,
                    },
                },
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
