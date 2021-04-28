import { Injectable } from '@nestjs/common';
import { CreateSocketSessionDto } from './dto/create-socket-session.dto';

import { SubscribersService } from 'src/api/subscribers/subscribers.service';
import { UsersService } from 'src/api/subscriber/users/users.service';

import { PrismaService } from 'src/prisma.service';
import { DataHelper } from 'src/helper/data-helper';
import { socket_session } from '@prisma/client';
import { AuthService } from 'src/auth/auth.service';

@Injectable()
export class SocketSessionsService {
    constructor(
        private prisma: PrismaService,
        private dataHelper: DataHelper,
        private authService: AuthService,
        private subscriberService: SubscribersService,
        private userService: UsersService,
    ) {}

    async createSocketSession(createSocketSessionDto: CreateSocketSessionDto, ip: any) {
        const subscriber = await this.subscriberService.findOneByApiKeyWithException(createSocketSessionDto.api_key);

        let userConnector: any = {};

        if (createSocketSessionDto.user_id) {
            userConnector = await this.userService.findOneByIdAndApiWithException(
                createSocketSessionDto.user_id,
                createSocketSessionDto.api_key,
            );

            const socket_session: any = await this.prisma.socket_session.findFirst({
                where: {
                    user_id: userConnector.id,
                },
            });

            if (socket_session) {
                const dataForToken = {
                    ...userConnector,
                    socket_session: socket_session,
                    token_type: 'socket',
                };

                return {
                    bearerToken: this.authService.createToken(dataForToken, 60 * 60 * 24 * 365),
                    data: dataForToken,
                    type: 'socket',
                };
            }

            userConnector = {
                user: {
                    connect: {
                        id: userConnector.id,
                    },
                },
            };
        }

        const createRes: any = await this.prisma.socket_session.create({
            data: {
                ip: ip,
                subscriber: {
                    connect: {
                        id: subscriber.id,
                    },
                },
                ...userConnector,
            },
        });

        const dataForToken = {
            ...userConnector,
            socket_session: createRes,
            token_type: 'socket',
        };

        return {
            bearerToken: this.authService.createToken(dataForToken, 60 * 60 * 24 * 365),
            data: dataForToken,
            type: 'socket',
        };
    }

    // async create(api_key: string, createChatClientDto: CreateChatClientDto) {
    //     const subscriber = await this.subscribersService.fineOneByApiKey(api_key);
    //     createChatClientDto.subscriber_id = subscriber.id;
    //     return await this.chatClientRepository.save(createChatClientDto);
    // }
    // async findAll(): Promise<ChatClient[]> {
    //     return await this.chatClientRepository.createQueryBuilder().getMany();
    // }

    async findOneClientConv(id: string, req: any) {
        const socketSession: any = await this.prisma.socket_session.findFirst({
            where: {
                id,
                subscriber_id: req.user.data.socket_session.subscriber_id,
                user_id: null,
                conversation_sessions: {
                    every: {
                        socket_session_id: req.user.data.socket_session.id,
                        conversation: {
                            users_only: false,
                            closed_at: null,
                        },
                    },
                },
            },
            include: {
                conversation_sessions: {
                    include: {
                        conversation: {
                            include: {
                                conversation_sessions: true, // this needed
                            },
                        },
                    },
                },
            },
        });

        if (socketSession && socketSession.conversation_sessions.length === 1) {
            return socketSession.conversation_sessions[0].conversation;
        }

        return null;
    }

    async findOne(id: string, req: any) {
        return this.prisma.socket_session.findFirst({
            where: { id, subscriber_id: req.user.data.socket_session.subscriber_id },
        });
    }

    async findOneWithException(id: string, req: any) {
        return await this.dataHelper.getSingleDataWithException(
            async () => await this.findOne(id, req),
            'socket_session',
        );
    }

    // update(id: number, updateChatClientDto: UpdateChatClientDto) {
    //     return `This action updates a #${id} chatClient`;
    // }
    // remove(id: number) {
    //     return `This action removes a #${id} chatClient`;
    // }
    // async getChatClientsByApiKey(api_key: string): Promise<ChatClient[]> {
    //     return await this.chatClientRepository
    //         .createQueryBuilder('chat_client')
    //         .leftJoin('chat_client.subscriber', 'subscriber')
    //         .where('subscriber.api_key = :api_key', { api_key: api_key })
    //         .getMany();
    // }
}
