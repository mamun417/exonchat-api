import { Injectable } from '@nestjs/common';
import { CreateSocketSessionDto } from './dto/create-socket-session.dto';

import { SubscribersService } from 'src/api/subscribers/subscribers.service';
import { ChatAgentsService } from 'src/api/chat-agents/chat-agents.service';

import { PrismaService } from 'src/prisma.service';
import { socket_session } from '@prisma/client';

@Injectable()
export class SocketSessionsService {
    constructor(
        private prisma: PrismaService,
        private subscriberService: SubscribersService,
        private chatAgentService: ChatAgentsService,
    ) {}

    async createSocketSession(createSocketSessionDto: CreateSocketSessionDto, ip: any) {
        const subscriber = await this.subscriberService.fineOneByApiKey(createSocketSessionDto.api_key);

        let agentConnector: any = {};

        if (createSocketSessionDto.agent_id) {
            agentConnector = await this.chatAgentService.findOne(createSocketSessionDto.agent_id);

            agentConnector = {
                chat_agent: {
                    connect: {
                        id: agentConnector.id,
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
                ...agentConnector,
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
    // async findOne(id: string) {
    //     return await this.chatClientRepository.findOne(id);
    // }
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
