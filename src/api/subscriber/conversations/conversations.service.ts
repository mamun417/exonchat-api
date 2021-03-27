import { HttpException, HttpStatus, Injectable, Post } from '@nestjs/common';

import { PrismaService } from 'src/prisma.service';

import { SubscribersService } from '../subscribers/subscribers.service';
import { SocketSessionsService } from '../socket-session/socket-sessions.service';
import { UsersService } from '../users/users.service';

import { CreateConversationDto } from './dto/create-conversation.dto';
import { JoinConversationDto } from './dto/join-conversation.dto';
import { LeaveConversationDto } from './dto/leave-conversation.dto';
import { CloseConversationDto } from './dto/close-conversation.dto';

import { conversation } from '@prisma/client';
import { DataHelper } from 'src/helper/data-helper';

@Injectable()
export class ConversationsService {
    constructor(
        private prisma: PrismaService,
        private dataHelper: DataHelper,
        private subscriberService: SubscribersService,
        private socketSessionService: SocketSessionsService,
        private userService: UsersService,
    ) {}

    async create(createConversationDto: CreateConversationDto) {
        const subscriber = await this.subscriberService.findOneByApiKeyWithException(createConversationDto.api_key);
        const socketSession = await this.socketSessionService.findOneWithException(createConversationDto.ses_id);

        if (!socketSession.user_id) {
            const convBySesId = await this.prisma.conversation.findFirst({
                where: {
                    created_by_id: createConversationDto.ses_id,
                },
            });

            if (convBySesId) throw new HttpException(`Already Created with this Session ID`, HttpStatus.CONFLICT);
        }

        return this.prisma.conversation.create({
            data: {
                users_only: createConversationDto.chat_type === 'user_to_user_chat' ? true : false,
                type: createConversationDto.chat_type,
                conversation_sessions: {
                    create: {
                        joined_at: new Date(),
                        socket_session: {
                            connect: { id: socketSession.id },
                        },
                        subscriber: {
                            connect: { id: subscriber.id },
                        },
                    },
                },
                subscriber: {
                    connect: { id: subscriber.id },
                },
                created_by: {
                    connect: { id: socketSession.id },
                },
            },
        });
    }

    async join(id: string, joinConversationDto: JoinConversationDto) {
        const subscriber = await this.subscriberService.findOneByApiKeyWithException(joinConversationDto.api_key);
        const socketSession = await this.socketSessionService.findOneWithException(joinConversationDto.ses_id);

        const conversation = await this.findOneWithException(id, { subscriber_id: subscriber.id });

        const convSes = await this.prisma.conversation_session.findUnique({
            where: {
                conv_ses_identifier: {
                    conversation_id: conversation.id,
                    socket_session_id: socketSession.id,
                },
            },
        });

        if (convSes) throw new HttpException(`Already joined to this conversation`, HttpStatus.CONFLICT);

        return this.prisma.conversation_session.create({
            data: {
                joined_at: new Date(),
                subscriber: {
                    connect: { id: subscriber.id },
                },
                socket_session: {
                    connect: { id: socketSession.id },
                },
                conversation: {
                    connect: { id: conversation.id },
                },
            },
        });
    }

    async leave(id: string, leaveConversationDto: LeaveConversationDto) {
        const subscriber = await this.subscriberService.findOneByApiKeyWithException(leaveConversationDto.api_key);
        const socketSession = await this.socketSessionService.findOneWithException(leaveConversationDto.ses_id);

        const conversation = await this.findOneWithException(id, {
            subscriber_id: subscriber.id,
        });

        const updated = await this.prisma.conversation_session.updateMany({
            where: {
                conversation_id: conversation.id,
                socket_session_id: socketSession.id,
                leaved_at: null,
            },
            data: {
                leaved_at: new Date(),
            },
        });

        if (!updated.count) {
            throw new HttpException(`Already leaved from this conversation`, HttpStatus.CONFLICT);
        }

        return this.prisma.conversation_session.findUnique({
            where: {
                conv_ses_identifier: {
                    conversation_id: conversation.id,
                    socket_session_id: socketSession.id,
                },
            },
        });
    }

    async close(id: string, closeConversationDto: CloseConversationDto) {
        const subscriber = await this.subscriberService.findOneByApiKeyWithException(closeConversationDto.api_key);
        const socketSession = await this.socketSessionService.findOneWithException(closeConversationDto.ses_id);

        const conversation = await this.findOneWithException(id, {
            subscriber_id: subscriber.id,
        });

        if (conversation.closed_at) {
            throw new HttpException('Already leaved from this conversation', HttpStatus.CONFLICT);
        }

        await this.prisma.conversation.update({
            where: {
                id: id,
            },
            data: {
                closed_at: new Date(),
                closed_by: {
                    connect: {
                        id: socketSession.id,
                    },
                },
                conversation_sessions: {
                    updateMany: {
                        where: {
                            leaved_at: null,
                        },
                        data: {
                            leaved_at: new Date(),
                        },
                    },
                },
            },
        });

        return conversation;
    }

    // async findAll(): Promise<Conversation[]> {
    //     return await this.conversationRepository.find({
    //         relations: ['messages'],ec_get_agents_online
    //     });
    // }

    async findOne(id: string, extraQueries: any = {}): Promise<conversation> {
        return this.prisma.conversation.findFirst({
            where: {
                id: id,
                ...extraQueries,
            },
        });
    }

    async findOneWithException(id: string, extraQueries: any = {}): Promise<conversation> {
        return await this.dataHelper.getSingleDataWithException(
            async () => await this.findOne(id, extraQueries),
            'conversation',
        );
    }

    // update(id: number, updateConversationDto: UpdateConversationDto) {
    //     return `This action updates a #${id} conversation`;
    // }

    // remove(id: number) {
    //     return `This action removes a #${id} conversation`;
    // }
}
