import { Injectable } from '@nestjs/common';
import { CreateSocketSessionDto } from './dto/create-socket-session.dto';

import { SubscribersService } from 'src/api/subscriber/subscribers/subscribers.service';
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

            const socket_session = await this.prisma.socket_session.findFirst({
                where: {
                    user_id: userConnector.id,
                },
            });

            if (socket_session) {
                return {
                    bearerToken: this.authService.createToken(socket_session, 60 * 60 * 24 * 365),
                    data: socket_session,
                    for: 'socket',
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

        const createRes = await this.prisma.socket_session.create({
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

        return {
            bearerToken: this.authService.createToken(createRes, 60 * 60 * 24 * 365),
            data: createRes,
            for: 'socket',
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

    async findOne(id: string, req: any) {
        return this.prisma.socket_session.findFirst({
            where: { id, subscriber_id: req.user.data.subscriber_id },
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
