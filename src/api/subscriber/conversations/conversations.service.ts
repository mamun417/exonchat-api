import { HttpException, HttpStatus, Injectable, Post } from '@nestjs/common';

import { PrismaService } from 'src/prisma.service';

import { SubscribersService } from '../subscribers/subscribers.service';
import { SocketSessionsService } from '../socket-session/socket-sessions.service';
import { UsersService } from '../users/users.service';

import { CreateConversationDto } from './dto/create-conversation.dto';
import { JoinConversationDto } from './dto/join-conversation.dto';
import { UpdateConversationDto } from './dto/update-conversation.dto';

@Injectable()
export class ConversationsService {
    constructor(
        private prisma: PrismaService,
        private subscriberService: SubscribersService,
        private socketSessionService: SocketSessionsService,
        private userService: UsersService,
    ) {}

    async create(createConversationDto: CreateConversationDto) {
        const subscriber = await this.subscriberService.fineOneByApiKey(createConversationDto.api_key);
        const socketSession = await this.socketSessionService.findOneWithException(createConversationDto.ses_id);

        if (!socketSession.user_id) {
            const convBySesId = await this.prisma.conversation.findFirst({
                where: {
                    created_by_id: createConversationDto.ses_id,
                },
            });

            if (convBySesId) throw new HttpException(`Already Created with this Session ID`, HttpStatus.CONFLICT);
        }

        return await this.prisma.conversation.create({
            data: {
                users_only: createConversationDto.chat_type === 'user_to_user_chat' ? true : false,
                type: createConversationDto.chat_type,
                conversation_sessions: {
                    create: {
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
        const subscriber = await this.subscriberService.fineOneByApiKey(joinConversationDto.api_key);
        const socketSession = await this.socketSessionService.findOneWithException(joinConversationDto.ses_id);

        const conversation = await this.prisma.conversation.findFirst({
            where: {
                id: id,
                subscriber_id: subscriber.id,
            },
        });

        return this.prisma.conversation_session.create({
            data: {
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

    // async findAll(): Promise<Conversation[]> {
    //     return await this.conversationRepository.find({
    //         relations: ['messages'],
    //     });
    // }

    // findOne(id: number) {
    //     return `This action returns a #${id} conversation`;
    // }

    // update(id: number, updateConversationDto: UpdateConversationDto) {
    //     return `This action updates a #${id} conversation`;
    // }

    // remove(id: number) {
    //     return `This action removes a #${id} conversation`;
    // }
}
