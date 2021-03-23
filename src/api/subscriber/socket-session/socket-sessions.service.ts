import { Injectable } from '@nestjs/common';
import { CreateSocketSessionDto } from './dto/create-socket-session.dto';

import { SubscribersService } from 'src/api/subscriber/subscribers/subscribers.service';
import { UsersService } from 'src/api/subscriber/users/users.service';

import { PrismaService } from 'src/prisma.service';
import { DataHelper } from 'src/helper/data-helper';
import { socket_session } from '@prisma/client';

@Injectable()
export class SocketSessionsService {
    constructor(
        private prisma: PrismaService,
        private dataHelper: DataHelper,
        private subscriberService: SubscribersService,
        private userService: UsersService,
    ) {}

    async createSocketSession(createSocketSessionDto: CreateSocketSessionDto, ip: any) {
        const subscriber = await this.subscriberService.fineOneByApiKey(createSocketSessionDto.api_key);

        let userConnector: any = {};

        if (createSocketSessionDto.user_id) {
            userConnector = await this.userService.findOne(createSocketSessionDto.user_id);

            userConnector = {
                user: {
                    connect: {
                        id: userConnector.id,
                    },
                },
            };
        }

        return this.prisma.socket_session.create({
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
    }

    // async create(api_key: string, createChatClientDto: CreateChatClientDto) {
    //     const subscriber = await this.subscribersService.fineOneByApiKey(api_key);
    //     createChatClientDto.subscriber_id = subscriber.id;
    //     return await this.chatClientRepository.save(createChatClientDto);
    // }
    // async findAll(): Promise<ChatClient[]> {
    //     return await this.chatClientRepository.createQueryBuilder().getMany();
    // }

    async findOne(id: string) {
        return await this.prisma.socket_session.findUnique({
            where: { id },
        });
    }

    async findOneWithException(id: string) {
        return await this.dataHelper.getSingleDataWithException(async () => await this.findOne(id));
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
